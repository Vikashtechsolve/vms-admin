import { useEffect, useMemo, useState } from 'react'
import { motion as MOTION, AnimatePresence } from 'framer-motion'
import { createJob, deleteJob, getJobs, updateJob } from '../services/api.js'

function Switch({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(value === 'Private' ? 'Public' : 'Private')}
      style={{ display: 'inline-flex', alignItems: 'center', width: 58, height: 28, background: value === 'Private' ? '#e6ecff' : '#e8f6ec', borderRadius: 20, padding: 4, border: '1px solid #e3e5ea' }}
      aria-label="Toggle visibility"
    >
      <div style={{ transform: value === 'Private' ? 'translateX(0)' : 'translateX(28px)', transition: 'transform .2s ease', width: 22, height: 22, borderRadius: 22, background: value === 'Private' ? '#4c7cf5' : '#218b4c' }} />
    </button>
  )
}

function JobCard({ job, onAction }) {
  return (
    <MOTION.article
      className="vendor-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="vendor-logo blue">JP</div>
      <div className="vendor-info">
        <div className="vendor-name">Job Posted : <span style={{ color: '#3d5bc6' }}>{job.title}</span></div>
        <div className="vendor-meta">
          Email : {job.email} <span>Contact Number : {job.contact}</span>
        </div>
        <div className="vendor-meta">
          Skills Required : {job.skills} <span>Experience Required : {job.experience}</span> <span>Number of Trainers : {job.trainersNeeded}</span>
        </div>
        <div className="vendor-meta">
          Level of Training : {job.level} <span>Training Type : {job.trainingType}</span> <span>Training Mode : {job.mode}</span>
        </div>
        <div className="vendor-meta">
          Training Duration : {job.duration} <span>Training Location : {job.location}</span>
        </div>
        <div className="vendor-meta">
          Budget/Pay Range : {job.budget} <span>Accommodation Provided : {job.accommodation}</span> <span>Language Preference : {job.language}</span>
        </div>
        {job.requirements?.length ? (
          <div className="vendor-meta">
            Requirements : {job.requirements.join(', ')}
          </div>
        ) : null}
        <div className="vendor-meta" style={{ alignItems: 'center' }}>
          Make this Posted Job Private/Public :
          <span style={{ marginLeft: 8, fontWeight: 600 }}>{job.visibility}</span>
          <span style={{ marginLeft: 10 }}>
            <Switch value={job.visibility} onChange={(next) => onAction('toggle', { ...job, visibility: next })} />
          </span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <button className="more-button" aria-label="More options" onClick={() => onAction('menu', job)}>⋯</button>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => onAction('addRequirement', job)}>
            <span className="btn-icon">+</span>
            <span>Add Requirement</span>
          </button>
          <button className="btn btn-ghost" onClick={() => onAction('edit', job)}>
            <span className="btn-icon">✎</span>
            <span>Edit</span>
          </button>
          <button className="btn btn-danger" onClick={() => onAction('delete', job)}>
            <span className="btn-icon">🗑</span>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </MOTION.article>
  )
}

function JobModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(
    initial || {
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
  )

  return (
    <AnimatePresence>
      {open && (
        <MOTION.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'grid', placeItems: 'center', zIndex: 40 }}
        >
          <MOTION.div
            initial={{ y: 20, opacity: 0, scale: .98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: .98 }}
            style={{ position: 'relative', background: '#fff', width: 720, borderRadius: 14, boxShadow: '0 24px 48px rgba(0,0,0,.18)', padding: 18 }}
          >
            <div style={{ fontWeight: 600, color: '#c7393d', marginBottom: 12 }}>{initial ? 'Edit Job Post' : 'Add Job Post'}</div>
            <button className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['title','email','contact','skills','experience','trainersNeeded','level','trainingType','mode','duration','location','budget','accommodation','language'].map((key) => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#6f6f76' }}>
                  <span style={{ textTransform: 'capitalize' }}>{key.replace('trainersNeeded','Number of Trainers').replace('trainingType','Training Type')}</span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ border: 'none', background: '#f7f8fb', borderRadius: 10, padding: '10px 12px', fontSize: 12, boxShadow: 'inset 0 0 0 1px #ececee', color: '#666' }}
                  />
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => onSubmit(form)}>
                <span className="btn-icon">+</span>
                <span>Save</span>
              </button>
            </div>
          </MOTION.div>
        </MOTION.div>
      )}
    </AnimatePresence>
  )
}

export default function JobPost() {
  const [jobs, setJobs] = useState([])
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pageLoaded, setPageLoaded] = useState(false)

  useEffect(() => {
    getJobs().then(setJobs)
    const t = setTimeout(() => setPageLoaded(true), 50)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return jobs.filter(j => `${j.title} ${j.skills} ${j.level} ${j.trainingType} ${j.mode} ${j.location} ${j.language}`.toLowerCase().includes(query))
  }, [jobs, q])

  function handleSubmit(form) {
    if (editing) {
      updateJob(editing.id, { ...editing, ...form }).then(res => {
        setJobs(cur => cur.map(j => j.id === res.id ? res : j))
        setEditing(null)
        setModalOpen(false)
      })
      return
    }
    createJob(form).then(res => {
      setJobs(cur => [res, ...cur])
      setModalOpen(false)
    })
  }

  function handleAction(type, payload) {
    if (type === 'toggle') {
      updateJob(payload.id, payload).then(res => setJobs(cur => cur.map(j => j.id === res.id ? res : j)))
      return
    }
    if (type === 'addRequirement') {
      const req = prompt('Enter requirement')
      if (!req) return
      const next = { ...payload, requirements: [...(payload.requirements||[]), req] }
      updateJob(payload.id, next).then(res => setJobs(cur => cur.map(j => j.id === res.id ? res : j)))
      return
    }
    if (type === 'edit') {
      setEditing(payload)
      setModalOpen(true)
      return
    }
    if (type === 'delete') {
      if (!confirm('Delete this job post?')) return
      deleteJob(payload.id).then(() => setJobs(cur => cur.filter(j => j.id !== payload.id)))
      return
    }
  }

  return (
    <>
      <MOTION.div
        className="hero-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Job Posts</h2>
          <p>Manage job postings and required skills for trainers and vendors !</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <span className="btn-icon">+</span>
            <span>Add Job Post</span>
          </button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <span className="btn-icon">+</span>
            <span>Add New Trainer</span>
          </button>
        </div>
      </MOTION.div>
      <div className="filters">
        <div className="filters-title">Search</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search here..." />
          </label>
          <label>
            <span>Filter</span>
            <select onChange={(e) => setQ(e.target.value)}>
              <option value="">All</option>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>
          </label>
        </div>
      </div>
      <MOTION.div
        className="vendor-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: pageLoaded ? 1 : 0 }}
      >
        <div className="vendor-title">JOB POSTED ({filtered.length.toString().padStart(2, '0')})</div>
        <div className="vendor-list">
          <AnimatePresence initial={false}>
            {filtered.map(job => (
              <JobCard key={job.id} job={job} onAction={handleAction} />
            ))}
          </AnimatePresence>
        </div>
      </MOTION.div>
      <JobModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={handleSubmit} initial={editing} />
    </>
  )
}
