import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  getTrainers,
  getTrainerFilterOptions,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  shiftTrainerToRecord,
} from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTrainerDuplicateCheck } from '../hooks/useTrainerDuplicateCheck.js'
import LocationSelect from '../components/LocationSelect.jsx'
import TrainerFilters, { EMPTY_FILTERS, countActiveFilters } from '../components/TrainerFilters.jsx'
import TrainerPagination, { readStoredPageSize, storePageSize } from '../components/TrainerPagination.jsx'
import ResumePreviewModal, { resumeDownloadUrl, downloadResumeFile } from '../components/ResumePreviewModal.jsx'

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

function formatRating(rating) {
  if (rating == null || rating === '') return null
  const n = Number(rating)
  if (Number.isNaN(n)) return null
  return n
}

function composeLocation(city, state, fallback = '') {
  if (!city) return fallback
  if (!state || state === 'Other') return city
  return `${city}, ${state}`
}

function statusLabel(status) {
  if (status === 'available') return 'Available'
  if (status === 'not_available') return 'Not Available'
  return null
}

function TrainerCard({ trainer, onAddComment, onDeleteComment, onEdit, onDelete, onShift }) {
  const initials = trainer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const hasPhoto = trainer.photo && String(trainer.photo).trim()
  const [photoError, setPhotoError] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [skillsExpanded, setSkillsExpanded] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const showPhoto = hasPhoto && !photoError
  const handlePhotoError = useCallback(() => setPhotoError(true), [])
  const email = trainer.email?.trim()
  const contact = trainer.contact?.trim()
  const location = (trainer.location || trainer.city || '').trim()
  const skills = parseSkills(trainer.subject)
  const hasMoreSkills = skills.length > SKILLS_PREVIEW_COUNT
  const visibleSkills = skillsExpanded || !hasMoreSkills
    ? skills
    : skills.slice(0, SKILLS_PREVIEW_COUNT)
  const hiddenSkillsCount = skills.length - SKILLS_PREVIEW_COUNT
  const rating = formatRating(trainer.rating)
  const linkedinUrl = trainer.linkedinUrl?.trim()
  const availability = statusLabel(trainer.status)
  const additionalDetails = trainer.additionalDetails?.trim()
  const hasExperience = !!(trainer.teachingExperience || trainer.developmentExperience || trainer.totalExperience)
  const hasDetails = !!(trainer.qualification || trainer.passingYear || trainer.payoutExpectations || trainer.resume)
  const longDetails = additionalDetails && additionalDetails.length > 140

  async function handleDownloadResume() {
    try {
      setDownloading(true)
      await downloadResumeFile(trainer.resume, trainer.name || 'trainer')
    } catch {
      window.open(resumeDownloadUrl(trainer.resume, `${trainer.name || 'trainer'}-resume`), '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

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
              <div className="trainer-record-name-row">
                <h3 className="trainer-record-name">{trainer.name}</h3>
                <div className="trainer-record-head-actions">
                  {rating != null && (
                    <div className="trainer-record-rating" title={`Rating ${rating}/10`}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>{rating}<small>/10</small></span>
                    </div>
                  )}
                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="trainer-linkedin-btn"
                      title="View LinkedIn profile"
                      aria-label={`${trainer.name} on LinkedIn`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.062 2.062 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  <TrainerMenu trainer={trainer} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>

              {(availability || trainer.workLookingFor || trainer.mode?.trim()) && (
                <div className="trainer-record-badges">
                  {availability && (
                    <span className={`trainer-record-badge trainer-record-badge--status trainer-record-badge--status-${trainer.status}`}>
                      {availability}
                    </span>
                  )}
                  {trainer.workLookingFor && (
                    <span className="trainer-record-badge">{trainer.workLookingFor}</span>
                  )}
                  {trainer.mode?.trim() && (
                    <span className="trainer-record-badge trainer-record-badge--muted">{trainer.mode}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {(email || contact || location) && (
            <div className="trainer-record-contacts">
              {email && (
                <a href={`mailto:${email}`} className="trainer-contact-chip trainer-contact-chip--email" title={email}>
                  <span className="trainer-contact-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <span className="trainer-contact-text">{email}</span>
                </a>
              )}
              {contact && (
                <a href={`tel:${contact.replace(/\s/g, '')}`} className="trainer-contact-chip trainer-contact-chip--phone" title={contact}>
                  <span className="trainer-contact-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <span className="trainer-contact-text">{contact}</span>
                </a>
              )}
              {location && (
                <span className="trainer-contact-chip trainer-contact-chip--location trainer-contact-chip--static" title={location}>
                  <span className="trainer-contact-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className="trainer-contact-text">{location}</span>
                </span>
              )}
            </div>
          )}

          {hasExperience && (
            <div className="trainer-record-stats">
              {trainer.teachingExperience && (
                <div className="trainer-stat">
                  <span className="trainer-stat-label">Teaching</span>
                  <span className="trainer-stat-value">{trainer.teachingExperience}</span>
                </div>
              )}
              {trainer.developmentExperience && (
                <div className="trainer-stat">
                  <span className="trainer-stat-label">Dev</span>
                  <span className="trainer-stat-value">{trainer.developmentExperience}</span>
                </div>
              )}
              {trainer.totalExperience && (
                <div className="trainer-stat trainer-stat--highlight">
                  <span className="trainer-stat-label">Total</span>
                  <span className="trainer-stat-value">{trainer.totalExperience}</span>
                </div>
              )}
            </div>
          )}

          {hasDetails && (
            <div className="trainer-record-details-block">
              {(trainer.qualification || trainer.passingYear || trainer.payoutExpectations) && (
                <div className="trainer-record-details">
                  <DetailItem label="Qualification" value={trainer.qualification} />
                  <DetailItem label="Passing Year" value={trainer.passingYear} />
                  <DetailItem label="Payout / Hour" value={trainer.payoutExpectations} />
                </div>
              )}
              {trainer.resume && (
                <div className="trainer-resume-card">
                  <div className="trainer-resume-card-info">
                    <span className="trainer-resume-card-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="13" y2="17" />
                      </svg>
                    </span>
                    <div className="trainer-resume-card-copy">
                      <span className="trainer-resume-card-label">Resume</span>
                      <span className="trainer-resume-card-hint">View or download file</span>
                    </div>
                  </div>
                  <div className="trainer-resume-actions">
                    <button
                      type="button"
                      className="trainer-resume-btn trainer-resume-btn--view"
                      onClick={() => setResumeOpen(true)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                    <button
                      type="button"
                      className="trainer-resume-btn trainer-resume-btn--download"
                      disabled={downloading}
                      onClick={handleDownloadResume}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {downloading ? 'Saving…' : 'Download'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {resumeOpen && trainer.resume && (
            <ResumePreviewModal
              url={trainer.resume}
              trainerName={trainer.name}
              onClose={() => setResumeOpen(false)}
            />
          )}

          {additionalDetails && (
            <div className="trainer-additional-details">
              <span className="trainer-additional-details-label">Additional Details</span>
              <p className={`trainer-additional-details-text${detailsExpanded || !longDetails ? '' : ' trainer-additional-details-text--clamp'}`}>
                {additionalDetails}
              </p>
              {longDetails && (
                <button
                  type="button"
                  className="trainer-details-toggle"
                  onClick={() => setDetailsExpanded((e) => !e)}
                >
                  {detailsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          <div className="trainer-comment-section">
            <div className="trainer-comment-head">
              <span className="trainer-comment-label">
                Comments{trainer.comments?.length ? ` (${trainer.comments.length})` : ''}
              </span>
              <button type="button" className="trainer-add-comment" onClick={() => onAddComment(trainer)}>
                <span className="trainer-add-comment-icon">+</span>
                Add
              </button>
            </div>
            {trainer.comments?.length > 0 && (() => {
              const comments = [...trainer.comments].reverse()
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
              <button type="button" className="shift-to-record-btn" onClick={() => onShift(trainer)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
                Shift to Record
              </button>
            </div>
          )}
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
  city: '',
  state: '',
  qualification: '',
  passingYear: '',
  subject: '',
  teachingExperience: '',
  developmentExperience: '',
  totalExperience: '',
  workLookingFor: 'Full-Time Trainer',
  mode: 'Offline Mode',
  payoutExpectations: '',
  rating: '',
  linkedinUrl: '',
  status: '',
  additionalDetails: '',
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
  const ratingRaw = String(form.rating ?? '').trim()
  const linkedinRaw = form.linkedinUrl?.trim()

  if (!name || !contact) {
    return 'Full name and contact number are required.'
  }
  if (email && !EMAIL_RE.test(email)) {
    return 'Enter a valid email address.'
  }
  if (ratingRaw) {
    const n = Number(ratingRaw)
    if (Number.isNaN(n) || n < 0 || n > 10) {
      return 'Rating must be a number between 0 and 10.'
    }
  }
  if (linkedinRaw) {
    const href = /^https?:\/\//i.test(linkedinRaw) ? linkedinRaw : `https://${linkedinRaw}`
    try {
      const parsed = new URL(href)
      if (!parsed.hostname.replace(/^www\./, '').includes('linkedin.com')) {
        return 'Enter a valid LinkedIn profile URL.'
      }
    } catch {
      return 'Enter a valid LinkedIn profile URL.'
    }
  }
  if (form.status && !['', 'available', 'not_available'].includes(form.status)) {
    return 'Select a valid availability status.'
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
  const [photoPreview, setPhotoPreview] = useState('')
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
      setForm({
        ...TRAINER_DEFAULTS,
        ...trainer,
        rating: trainer.rating == null ? '' : String(trainer.rating),
        status: trainer.status || '',
      })
      setPhotoFile(null)
      setResumeFile(null)
      setDuplicateBaseline({ email: trainer.email || '', contact: trainer.contact || '' })
    }
  }, [trainer, isAdd, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, saving, onClose])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(form.photo || '')
      return undefined
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile, form.photo])

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
      const normalizedRating = String(form.rating ?? '').trim()
      const baseFields = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        contact: normalizedContact,
        linkedinUrl: form.linkedinUrl?.trim() || '',
        city: form.city || '',
        state: form.state || '',
        location: composeLocation(form.city, form.state, form.location || ''),
        status: form.status || '',
        additionalDetails: form.additionalDetails?.trim() || '',
        rating: normalizedRating === '' ? '' : Number(normalizedRating),
      }
      const payload = isAdd
        ? baseFields
        : {
            ...trainer,
            ...baseFields,
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

  const modal = (
    <div className="modal-overlay trainer-form-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal-content edit-trainer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-trainer-title"
      >
        <header className="trainer-form-head">
          <div className="trainer-form-head-main">
            <div className="trainer-form-head-icon" aria-hidden="true">
              {isAdd ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              )}
            </div>
            <div className="trainer-form-head-copy">
              <p className="trainer-form-kicker">{isAdd ? 'New profile' : 'Update profile'}</p>
              <h3 id="edit-trainer-title">{isAdd ? 'Create New Trainer Profile' : 'Edit Trainer Details'}</h3>
              <p className="trainer-form-subtitle">
                {isAdd
                  ? 'Add personal, professional, and upload details to create a complete trainer card.'
                  : 'Update trainer information, availability, and documents.'}
              </p>
            </div>
          </div>
          <button type="button" className="trainer-form-close" aria-label="Close" onClick={handleClose} disabled={saving}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

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

            <section className="trainer-form-section">
              <div className="trainer-form-section-head">
                <span className="trainer-form-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <h4>Personal Information</h4>
                  <p>Basic identity and contact details</p>
                </div>
              </div>
              <div className="trainer-form-section-grid">
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
                    placeholder="name@example.com (optional)"
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
                <div className="trainer-form-location edit-trainer-span-2">
                  <LocationSelect
                    state={form.state}
                    city={form.city}
                    legacyLocation={form.city ? '' : form.location}
                    disabled={saving}
                    onChange={({ state, city }) => setForm((f) => ({ ...f, state, city }))}
                  />
                </div>
              </div>
            </section>

            <section className="trainer-form-section">
              <div className="trainer-form-section-head">
                <span className="trainer-form-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </span>
                <div>
                  <h4>Professional Information</h4>
                  <p>Skills, experience, and engagement preferences</p>
                </div>
              </div>
              <div className="trainer-form-section-grid">
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
                <label className="edit-trainer-span-2">
                  <span>Subject / Skills</span>
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
              </div>
            </section>

            <section className="trainer-form-section">
              <div className="trainer-form-section-head">
                <span className="trainer-form-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <div>
                  <h4>Additional Details</h4>
                  <p>Rating, availability, and notes</p>
                </div>
              </div>
              <div className="trainer-form-section-grid">
                <label>
                  <span>Rating (out of 10)</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setField('rating', e.target.value)}
                    placeholder="e.g. 8.5 (optional)"
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Availability Status</span>
                  <select value={form.status} onChange={(e) => setField('status', e.target.value)} disabled={saving}>
                    <option value="">Not set</option>
                    <option value="available">Available</option>
                    <option value="not_available">Not Available</option>
                  </select>
                </label>
                <label className="edit-trainer-span-2">
                  <span>LinkedIn Profile URL</span>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setField('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/username (optional)"
                    disabled={saving}
                  />
                </label>
                <label className="edit-trainer-span-2">
                  <span>Additional Details</span>
                  <textarea
                    value={form.additionalDetails}
                    onChange={(e) => setField('additionalDetails', e.target.value)}
                    placeholder="Any extra notes about the trainer (optional)"
                    rows={3}
                    disabled={saving}
                  />
                </label>
              </div>
            </section>

            <section className="trainer-form-section">
              <div className="trainer-form-section-head">
                <span className="trainer-form-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <div>
                  <h4>Uploads</h4>
                  <p>Profile photo and resume documents</p>
                </div>
              </div>
              <div className="trainer-form-uploads">
                <label className={`trainer-upload-tile${photoFile || form.photo ? ' trainer-upload-tile--filled' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    onChange={(e) => pickPhoto(e.target.files?.[0] || null)}
                  />
                  <div className="trainer-upload-preview">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" />
                    ) : (
                      <span className="trainer-upload-placeholder" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="trainer-upload-meta">
                    <strong>Profile photo</strong>
                    <span>{photoFile ? photoFile.name : form.photo ? 'Current photo set — click to replace' : 'JPG, PNG or WebP · max 5MB'}</span>
                  </div>
                </label>

                <label className={`trainer-upload-tile${resumeFile || form.resume ? ' trainer-upload-tile--filled' : ''}`}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    disabled={saving}
                    onChange={(e) => pickResume(e.target.files?.[0] || null)}
                  />
                  <div className="trainer-upload-preview trainer-upload-preview--doc">
                    <span className="trainer-upload-placeholder" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                  </div>
                  <div className="trainer-upload-meta">
                    <strong>Resume</strong>
                    <span>
                      {resumeFile
                        ? resumeFile.name
                        : form.resume
                          ? (
                            <>
                              Current resume set — click to replace ·{' '}
                              <a href={form.resume} target="_blank" rel="noopener noreferrer" className="trainer-link" onClick={(e) => e.stopPropagation()}>
                                View
                              </a>
                            </>
                          )
                          : 'PDF or DOC · max 5MB'}
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <div className="modal-actions trainer-form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary trainer-form-submit" disabled={saving || checking || !canSubmit}>
              {saving ? (
                <>
                  <span className="modal-spinner modal-spinner--on-dark" aria-hidden="true" />
                  {isAdd ? 'Creating…' : 'Saving…'}
                </>
              ) : checking ? (
                'Checking…'
              ) : (
                isAdd ? 'Create Profile' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
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

/** Maps the UI filter state onto the query params the list endpoint expects. */
function toQueryParams(filters, page, pageSize, source) {
  const [minExperience, maxExperience] = filters.experience
    ? filters.experience.split('-')
    : ['', '']

  const params = { page, limit: pageSize, sort: filters.sort, source }
  if (filters.q.trim()) params.q = filters.q.trim()
  if (filters.states.length) params.state = filters.states.join(',')
  if (filters.cities.length) params.city = filters.cities.join(',')
  if (filters.skills.length) {
    params.skills = filters.skills.join(',')
    params.skillsMatch = filters.skillsMatch
  }
  if (filters.qualifications.length) params.qualifications = filters.qualifications.join(',')
  if (filters.workTypes.length) params.workTypes = filters.workTypes.join(',')
  if (filters.modes.length) params.modes = filters.modes.join(',')
  if (filters.status.length) params.status = filters.status.join(',')
  if (filters.minRating) params.minRating = filters.minRating
  if (minExperience) params.minExperience = minExperience
  if (maxExperience) params.maxExperience = maxExperience
  return params
}

export default function Trainers({ mode = 'records' }) {
  const isRegistrations = mode === 'registrations'
  const source = isRegistrations ? 'website' : 'admin'
  const { user } = useAuth()
  const [trainers, setTrainers] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterOptions, setFilterOptions] = useState({ skills: [], qualifications: [], cities: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(readStoredPageSize)
  const [result, setResult] = useState({ total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [commentModal, setCommentModal] = useState(null)
  const [editModal, setEditModal] = useState(null) // null = closed, 'add' = add mode, trainer = edit
  const [toast, setToast] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const requestSeq = useRef(0)
  const listTopRef = useRef(null)

  const refreshFilterOptions = useCallback(() => {
    getTrainerFilterOptions({ source })
      .then(setFilterOptions)
      .catch(() => {})
  }, [source])

  useEffect(() => { refreshFilterOptions() }, [refreshFilterOptions, reloadKey])

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const seq = ++requestSeq.current
    setLoading(true)
    const timer = setTimeout(() => {
      getTrainers(toQueryParams(filters, page, pageSize, source))
        .then((data) => {
          if (seq !== requestSeq.current) return
          const total = data.total || 0
          const pages = Math.max(data.pages || 1, 1)
          setTrainers(data.items || [])
          setResult({ total, pages })
          // If filters shrank the result set, stay on a valid page.
          if (page > pages) setPage(pages)
          setLoadError('')
          setLoading(false)
        })
        .catch(() => {
          if (seq !== requestSeq.current) return
          setTrainers([])
          setResult({ total: 0, pages: 1 })
          setLoadError('Could not load trainers. Please try again.')
          setLoading(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, page, pageSize, reloadKey, source])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function handleFiltersChange(next) {
    setFilters(next)
    setPage(1)
  }

  function goToPage(nextPage) {
    setPage(nextPage)
    scrollListToFilters()
  }

  function handlePageSizeChange(nextSize) {
    storePageSize(nextSize)
    setPageSize(nextSize)
    setPage(1)
    scrollListToFilters()
  }

  function scrollListToFilters() {
    const scrollEl = listTopRef.current
    if (!scrollEl) return
    const toolbar = scrollEl.querySelector('.trainers-toolbar')
    scrollEl.scrollTo({
      top: toolbar ? Math.max(toolbar.offsetTop - 8, 0) : 0,
      behavior: 'smooth',
    })
  }

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
    setToast({ type: 'success', text: `Trainer profile created for ${res.name}.` })
    setPage(1)
    setReloadKey((k) => k + 1)
  }

  async function handleEditTrainer(payload, photoFile, resumeFile) {
    const id = payload.id
    const res = await updateTrainer(id, payload, photoFile, resumeFile)
    setTrainers((cur) => cur.map((t) => (t.id === id ? res : t)))
    setToast({ type: 'success', text: `Trainer profile updated for ${res.name}.` })
    refreshFilterOptions()
  }

  function handleDeleteTrainer(trainer) {
    if (!confirm(`Delete trainer "${trainer.name}"?`)) return
    setTrainers((cur) => cur.filter((t) => t.id !== trainer.id))
    deleteTrainer(trainer.id)
      .then(() => {
        setToast({ type: 'success', text: `Deleted ${trainer.name}.` })
        setReloadKey((k) => k + 1)
      })
      .catch(() => {
        setTrainers((cur) => [trainer, ...cur])
        setToast({ type: 'error', text: 'Failed to delete trainer. Please try again.' })
      })
  }

  function handleShiftToRecord(trainer) {
    if (!confirm(`Shift "${trainer.name}" to Trainer Records?`)) return
    setTrainers((cur) => cur.filter((t) => t.id !== trainer.id))
    shiftTrainerToRecord(trainer.id)
      .then((res) => {
        setToast({ type: 'success', text: `${res.name} moved to Trainer Records.` })
        setReloadKey((k) => k + 1)
      })
      .catch(() => {
        setTrainers((cur) => [trainer, ...cur])
        setToast({ type: 'error', text: 'Failed to shift trainer. Please try again.' })
      })
  }

  const hasAnyFilter = countActiveFilters(filters) > 0 || !!filters.q.trim()
  const rangeStart = result.total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, result.total)

  return (
    <div className="trainers-page">
      {toast && (
        <div className={`page-toast page-toast--${toast.type}`} role="status">
          {toast.text}
          <button type="button" className="page-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="trainers-page-scroll" ref={listTopRef}>
        <div className="hero-card">
          <div>
            <h2>{isRegistrations ? 'Trainer Registration' : 'Trainers'}</h2>
            <p>
              {isRegistrations
                ? 'Website trainer signups. Review details and shift approved profiles to Trainer Records.'
                : 'Manage trainer profiles, verify details, and maintain accurate training records!'}
            </p>
          </div>
          {!isRegistrations && (
            <div className="trainer-add-card" onClick={() => setEditModal('add')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setEditModal('add')}>
              <span className="trainer-add-icon">+</span>
              <span className="trainer-add-text">Create New Trainer Profile</span>
            </div>
          )}
        </div>

        <div className="trainers-toolbar">
          <TrainerFilters
            filters={filters}
            onChange={handleFiltersChange}
            options={filterOptions}
            loading={loading}
            resultCount={result.total}
          />
        </div>

        <div className="vendor-section">
          <div className="vendor-title">
            {isRegistrations ? 'TRAINER REGISTRATIONS' : 'TRAINER LIST'} ({String(result.total).padStart(2, '0')})
            {result.total > 0 && (
              <span className="trainer-range">Showing {rangeStart}–{rangeEnd}</span>
            )}
          </div>

          {loadError && <div className="modal-banner modal-banner--error" role="alert">{loadError}</div>}

          {loading && trainers.length === 0 && (
            <div className="trainer-loading" role="status" aria-live="polite" aria-busy="true">
              <div className="trainer-loading-panel">
                <div className="trainer-loading-orb" aria-hidden="true">
                  <span className="trainer-loading-ring" />
                  <span className="trainer-loading-dot" />
                </div>
                <p className="trainer-loading-title">Loading trainers</p>
                <p className="trainer-loading-text">Fetching profiles and filter results…</p>
              </div>
              <div className="trainer-skeleton-list" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="trainer-skeleton-card">
                    <div className="trainer-skeleton-photo" />
                    <div className="trainer-skeleton-body">
                      <div className="trainer-skeleton-line trainer-skeleton-line--lg" />
                      <div className="trainer-skeleton-line trainer-skeleton-line--sm" />
                      <div className="trainer-skeleton-chips">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="trainer-skeleton-line" />
                      <div className="trainer-skeleton-line trainer-skeleton-line--md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !loadError && trainers.length === 0 && (
            <div className="trainer-empty">
              <p className="trainer-empty-title">
                {isRegistrations ? 'No website registrations yet' : 'No trainers match these filters'}
              </p>
              <p className="trainer-empty-text">
                {isRegistrations
                  ? 'New trainer signups from the website will appear here.'
                  : hasAnyFilter
                    ? 'Try removing a filter or widening the experience and rating ranges.'
                    : 'Create your first trainer profile to get started.'}
              </p>
              {hasAnyFilter && !isRegistrations && (
                <button type="button" className="btn btn-ghost" onClick={() => handleFiltersChange({ ...EMPTY_FILTERS, sort: filters.sort })}>
                  Clear all filters
                </button>
              )}
              {hasAnyFilter && isRegistrations && (
                <button type="button" className="btn btn-ghost" onClick={() => handleFiltersChange({ ...EMPTY_FILTERS, sort: filters.sort })}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          <div className={`vendor-list${loading && trainers.length > 0 ? ' vendor-list--loading' : ''}`}>
            {loading && trainers.length > 0 && (
              <div className="trainer-refresh-overlay" role="status" aria-live="polite" aria-busy="true">
                <div className="trainer-refresh-pill">
                  <span className="trainer-refresh-spinner" aria-hidden="true" />
                  Updating results…
                </div>
              </div>
            )}
            {trainers.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                onAddComment={setCommentModal}
                onDeleteComment={handleDeleteComment}
                onEdit={setEditModal}
                onDelete={handleDeleteTrainer}
                onShift={isRegistrations ? handleShiftToRecord : undefined}
              />
            ))}
          </div>

          <TrainerPagination
            page={page}
            pages={result.pages}
            total={result.total}
            pageSize={pageSize}
            loading={loading}
            onPageChange={goToPage}
            onPageSizeChange={handlePageSizeChange}
          />
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
    </div>
  )
}
