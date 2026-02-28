import { useEffect, useMemo, useState, useRef } from 'react'
import { motion as MOTION, AnimatePresence } from 'framer-motion'
import { createJob, deleteJob, getJobApplications, getJobs, updateJob } from '../services/api.js'

function Switch({ value, onChange }) {
  const isPublic = value === 'Public'
  return (
    <button
      type="button"
      className="visibility-toggle"
      onClick={() => onChange(isPublic ? 'Private' : 'Public')}
      aria-label="Toggle visibility"
    >
      <span className={`visibility-toggle-thumb ${isPublic ? 'public' : 'private'}`} />
    </button>
  )
}

function JobMenu({ job, onEdit, onDelete, onAddRequirement, onViewApplications }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [open])
  return (
    <div className="job-menu-wrap" ref={wrapRef}>
      <button className="more-button" aria-label="More options" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="job-menu-dropdown">
          <button type="button" className="job-menu-item" onClick={() => { onEdit(job); setOpen(false) }}>
            <span className="job-menu-icon">✎</span>
            Edit Details
          </button>
          <button type="button" className="job-menu-item" onClick={() => { onAddRequirement(job); setOpen(false) }}>
            <span className="job-menu-icon">+</span>
            Add Requirement
          </button>
          <button type="button" className="job-menu-item" onClick={() => { onViewApplications(job); setOpen(false) }}>
            <span className="job-menu-icon">👥</span>
            View Applications
          </button>
          <button type="button" className="job-menu-item danger" onClick={() => { onDelete(job); setOpen(false) }}>
            <span className="job-menu-icon">🗑</span>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, onAction }) {
  return (
    <MOTION.article
      className="job-record-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="job-record-header">
        <div className="job-record-profile">
          <div className="job-record-logo">JP</div>
          <h3 className="job-record-title">Job Posted : <span className="job-title-text">{job.title}</span></h3>
        </div>
        <JobMenu
          job={job}
          onEdit={(j) => onAction('edit', j)}
          onDelete={(j) => onAction('delete', j)}
          onAddRequirement={(j) => onAction('addRequirement', j)}
          onViewApplications={(j) => onAction('viewApplications', j)}
        />
      </div>

      <div className="job-record-meta">
        <span><span className="meta-label">Email :</span> <span className="meta-value">{job.email}</span></span>
        <span className="meta-sep"><span className="meta-label">Contact Number :</span> <span className="meta-value">{job.contact}</span></span>
      </div>
      <div className="job-record-meta">
        <span><span className="meta-label">Skills Required :</span> <span className="meta-value">{job.skills}</span></span>
        <span className="meta-sep"><span className="meta-label">Experience Required :</span> <span className="meta-value">{job.experience}</span></span>
        <span className="meta-sep"><span className="meta-label">Number of Trainers :</span> <span className="meta-value">{job.trainersNeeded}</span></span>
      </div>
      <div className="job-record-meta">
        <span><span className="meta-label">Level of Training :</span> <span className="meta-value">{job.level}</span></span>
        <span className="meta-sep"><span className="meta-label">Training Type :</span> <span className="meta-value">{job.trainingType}</span></span>
        <span className="meta-sep"><span className="meta-label">Training Mode :</span> <span className="meta-value">{job.mode}</span></span>
      </div>
      <div className="job-record-meta">
        <span><span className="meta-label">Training Duration :</span> <span className="meta-value">{job.duration}</span></span>
        <span className="meta-sep"><span className="meta-label">Training Location :</span> <span className="meta-value">{job.location}</span></span>
      </div>
      <div className="job-record-meta">
        <span><span className="meta-label">Budget/Pay Range :</span> <span className="meta-value">{job.budget}</span></span>
        <span className="meta-sep"><span className="meta-label">Accommodation :</span> <span className="meta-value">{job.accommodation}</span></span>
        <span className="meta-sep"><span className="meta-label">Language :</span> <span className="meta-value">{job.language}</span></span>
      </div>
      {job.requirements?.length > 0 && (
        <div className="job-record-meta">
          <span><span className="meta-label">Requirements :</span> <span className="meta-value">{job.requirements.join(', ')}</span></span>
        </div>
      )}
      <div className="job-record-meta job-visibility-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span><span className="meta-label">Visibility :</span></span>
          <span className={`visibility-badge ${job.visibility === 'Public' ? 'public' : 'private'}`}>
            {job.visibility}
          </span>
          <Switch value={job.visibility} onChange={(next) => onAction('toggle', { ...job, visibility: next })} />
        </div>
        <button
          type="button"
          className="btn btn-ghost view-applications-btn"
          onClick={() => onAction('viewApplications', job)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          View Applications
        </button>
      </div>
    </MOTION.article>
  )
}

const JOB_FORM_FIELDS = [
  ['title', 'Job Title'],
  ['email', 'Email'],
  ['contact', 'Contact Number'],
  ['skills', 'Skills Required'],
  ['experience', 'Experience Required'],
  ['trainersNeeded', 'Number of Trainers'],
  ['level', 'Level of Training'],
  ['trainingType', 'Training Type'],
  ['mode', 'Training Mode'],
  ['duration', 'Training Duration'],
  ['location', 'Training Location'],
  ['budget', 'Budget/Pay Range'],
  ['accommodation', 'Accommodation Provided'],
  ['language', 'Language Preference'],
]

const JOB_DEFAULTS = {
  title: '',
  email: '',
  contact: '',
  skills: '',
  experience: '',
  trainersNeeded: '',
  level: 'Intermediate',
  trainingType: 'Corporate Training',
  mode: 'Offline Mode',
  duration: '',
  location: '',
  budget: '',
  accommodation: 'No',
  language: '',
  visibility: 'Private',
  requirements: [],
}

function AddEditJobModal({ open, job, isAdd, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...JOB_DEFAULTS })
  useEffect(() => {
    if (isAdd) setForm({ ...JOB_DEFAULTS })
    else if (job) setForm({ ...JOB_DEFAULTS, ...job })
  }, [job, isAdd, open])
  if (!open) return null
  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(isAdd ? form : { ...job, ...form })
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content edit-job-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add Job Post' : 'Edit Job Post'}</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="edit-job-form">
            {JOB_FORM_FIELDS.map(([key, label]) => (
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
            <label>
              <span>Visibility</span>
              <select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}>
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
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

function ApplicationsDrawer({ job, onClose }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!job) return
    setLoading(true)
    setError('')
    setSearch('')
    getJobApplications(job.id)
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [job])

  if (!job) return null

  function formatDate(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return iso }
  }

  function getInitials(name) {
    return (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const filtered = applications.filter((app) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${app.name} ${app.email} ${app.phone}`.toLowerCase().includes(q)
  })

  const avatarColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1']

  return (
    <div className="appdrawer-overlay" onClick={onClose} aria-hidden="true">
      <div className="appdrawer" onClick={(e) => e.stopPropagation()}>

        {/* Drawer Header */}
        <div className="appdrawer-header">
          <div className="appdrawer-back" onClick={onClose} role="button" tabIndex={0} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </div>
          <div className="appdrawer-title-group">
            <h2 className="appdrawer-title">Applicants</h2>
            <p className="appdrawer-subtitle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 11h8M8 15h5" />
              </svg>
              {job.title}
            </p>
          </div>
          {!loading && !error && (
            <div className="appdrawer-badge">{applications.length}</div>
          )}
        </div>

        {/* Search */}
        {!loading && !error && applications.length > 0 && (
          <div className="appdrawer-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" className="appdrawer-search-icon">
              <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="appdrawer-search"
            />
            {search && (
              <button type="button" className="appdrawer-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="appdrawer-body">

          {/* Loading */}
          {loading && (
            <div className="appdrawer-state">
              <span className="spinner" />
              <span>Loading applications…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="appdrawer-state appdrawer-state-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && applications.length === 0 && (
            <div className="appdrawer-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="56" height="56">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="appdrawer-state-title">No applications yet</p>
              <span className="appdrawer-state-sub">Applications submitted through the public site will appear here.</span>
            </div>
          )}

          {/* No search results */}
          {!loading && !error && applications.length > 0 && filtered.length === 0 && (
            <div className="appdrawer-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" />
              </svg>
              <p className="appdrawer-state-title">No results for "{search}"</p>
            </div>
          )}

          {/* Applicant Cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="appdrawer-list">
              {filtered.map((app, i) => {
                const color = avatarColors[i % avatarColors.length]
                return (
                  <div key={app.id} className="appcard">
                    <div className="appcard-avatar" style={{ background: color }}>
                      {getInitials(app.name)}
                    </div>
                    <div className="appcard-body">
                      <div className="appcard-top">
                        <span className="appcard-name">{app.name}</span>
                        <span className="appcard-date">{formatDate(app.appliedAt)}</span>
                      </div>
                      <div className="appcard-meta">
                        <a href={`mailto:${app.email}`} className="appcard-link">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          {app.email}
                        </a>
                        <span className="appcard-dot" />
                        <a href={`tel:${app.phone}`} className="appcard-link">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {app.phone}
                        </a>
                      </div>
                      <div className="appcard-resume">
                        {app.resumeUrl ? (
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="appcard-resume-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                            View Resume
                          </a>
                        ) : (
                          <span className="appcard-no-resume">No resume uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobPost() {
  const [jobs, setJobs] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(null) // null | 'add' | job object
  const [applicationsJob, setApplicationsJob] = useState(null)

  useEffect(() => {
    getJobs().then(setJobs).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const filterVal = filter.trim()
    return jobs.filter((j) => {
      const blob = `${j.title || ''} ${j.skills || ''} ${j.level || ''} ${j.trainingType || ''} ${j.mode || ''} ${j.location || ''} ${j.language || ''}`.toLowerCase()
      const matchQuery = !query || blob.includes(query)
      const matchFilter = !filterVal || (filterVal === 'Private' && j.visibility === 'Private') || (filterVal === 'Public' && j.visibility === 'Public') || (filterVal === 'Offline' && (j.mode || '').toLowerCase().includes('offline')) || (filterVal === 'Online' && (j.mode || '').toLowerCase().includes('online'))
      return matchQuery && matchFilter
    })
  }, [jobs, q, filter])

  function handleAction(type, payload) {
    if (type === 'toggle') {
      setJobs((cur) => cur.map((j) => (j.id === payload.id ? payload : j)))
      updateJob(payload.id, payload).catch(() => {})
      return
    }
    if (type === 'addRequirement') {
      const req = prompt('Enter requirement')
      if (!req) return
      const next = { ...payload, requirements: [...(payload.requirements || []), req] }
      setJobs((cur) => cur.map((j) => (j.id === payload.id ? next : j)))
      updateJob(payload.id, next).catch(() => {})
      return
    }
    if (type === 'edit') {
      setModalOpen(payload)
      return
    }
    if (type === 'delete') {
      if (!confirm(`Delete job post "${payload.title}"?`)) return
      setJobs((cur) => cur.filter((j) => j.id !== payload.id))
      deleteJob(payload.id).catch(() => {})
      return
    }
    if (type === 'viewApplications') {
      setApplicationsJob(payload)
      return
    }
  }

  function handleCreate(form) {
    createJob(form)
      .then((res) => {
        setJobs((cur) => [res, ...cur])
        setModalOpen(null)
      })
      .catch(() => {
        setJobs((cur) => [{ ...form, id: Date.now() }, ...cur])
        setModalOpen(null)
      })
  }

  function handleEdit(updated) {
    setJobs((cur) => cur.map((j) => (j.id === updated.id ? updated : j)))
    updateJob(updated.id, updated).catch(() => {})
  }

  return (
    <>
      <MOTION.div className="hero-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2>Job Posts</h2>
          <p>Manage job postings and required skills for trainers and vendors.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen('add')}>
          <span className="btn-icon">+</span>
          <span>Add Job Post</span>
        </button>
      </MOTION.div>
      <div className="filters">
        <div className="filters-title">Search job posts</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search here..." />
          </label>
          <label>
            <span>Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>
          </label>
        </div>
      </div>
      <div className="vendor-section">
        <div className="vendor-title">JOB POSTED ({String(filtered.length).padStart(2, '0')})</div>
        <div className="vendor-list">
          <AnimatePresence initial={false}>
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} onAction={handleAction} />
            ))}
          </AnimatePresence>
        </div>
      </div>
      <AddEditJobModal
        open={!!modalOpen}
        job={modalOpen === 'add' ? null : modalOpen}
        isAdd={modalOpen === 'add'}
        onClose={() => setModalOpen(null)}
        onSubmit={(data) => (modalOpen === 'add' ? handleCreate(data) : handleEdit(data))}
      />
      <ApplicationsDrawer
        job={applicationsJob}
        onClose={() => setApplicationsJob(null)}
      />
    </>
  )
}
