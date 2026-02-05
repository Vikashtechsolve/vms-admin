import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion as MOTION } from 'framer-motion'
import { createVendor, deleteVendor, getVendors, updateVendor } from '../services/api.js'

function VendorCard({ v, onAction }) {
  const initials = (v.company || '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <article className="vendor-card">
      <div className={`vendor-logo ${v.logoTint || ''}`}>{initials || 'VN'}</div>
      <div className="vendor-info">
        <div className="vendor-name">{v.company}</div>
        <div className="vendor-meta">
          Company Type : {v.type}
          <span>Company Size : {v.size}</span>
          <span>Status : {v.status}</span>
        </div>
        <div className="vendor-meta">
          HR Name : {v.hrName}
          <span>E-mail : {v.email}</span>
          <span>Contact Number : {v.phone}</span>
        </div>
        <div className="vendor-meta">
          Training Skills/Technologies Required : {v.skills}
        </div>
        <div className="vendor-meta">
          Hiring Type : {v.hiring}
          <span>Mode : {v.mode}</span>
        </div>
      </div>
      <MenuButton onAction={(a) => onAction(a, v)} />
    </article>
  )
}

function MenuButton({ onAction }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button className="more-button" aria-label="More options" onClick={() => setOpen(o => !o)}>⋯</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, background: '#fff', boxShadow: '0 12px 24px rgba(0,0,0,.08)', borderRadius: 10, padding: 6, minWidth: 160 }}>
          <MenuItem label="View" onClick={() => { onAction('view'); setOpen(false) }} />
          <MenuItem label="Edit" onClick={() => { onAction('edit'); setOpen(false) }} />
          <MenuItem label="Set Active" onClick={() => { onAction('active'); setOpen(false) }} />
          <MenuItem label="Set On-hold" onClick={() => { onAction('hold'); setOpen(false) }} />
          <MenuItem label="Delete" danger onClick={() => { onAction('delete'); setOpen(false) }} />
        </div>
      )}
    </div>
  )
}

function MenuItem({ label, danger, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 10px', color: danger ? '#c7393d' : '#333', fontSize: 12, borderRadius: 8 }}>
      <span className="btn-icon" style={{ background: danger ? '#f8dada' : '#f0f1f5', color: danger ? '#c7393d' : '#555' }}>
        {danger ? '🗑' : '✎'}
      </span>
      <span>{label}</span>
    </button>
  )
}

function AddVendorModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
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
  })
  if (!open) return null
  return (
    <AnimatePresence>
      <MOTION.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'grid', placeItems: 'center', zIndex: 30 }}
      >
      <MOTION.div
        initial={{ opacity: 0, scale: .98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .98, y: -6 }}
        style={{ position: 'relative', background: '#fff', width: 520, borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.2)', padding: 16 }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#c7393d' }}>Add Vendor</div>
        <button className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['company', 'Company'],
            ['type', 'Company Type'],
            ['size', 'Company Size'],
            ['status', 'Status'],
            ['hrName', 'HR Name'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['skills', 'Required Skills'],
            ['hiring', 'Hiring Type'],
            ['mode', 'Mode'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#6f6f76' }}>
              <span>{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ border: 'none', background: '#f7f8fb', borderRadius: 10, padding: '10px 12px', fontSize: 12, boxShadow: 'inset 0 0 0 1px #ececee', color: '#666' }}
              />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => onSubmit(form)}>
            <span className="btn-icon">+</span>
            <span>Create</span>
          </button>
        </div>
      </MOTION.div>
      </MOTION.div>
    </AnimatePresence>
  )
}

export default function Vendors({ globalSearch }) {
  const [vendors, setVendors] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getVendors().then(setVendors)
  }, [])

  const query = (globalSearch || '').trim().toLowerCase()
  const qLocal = (localQuery || '').trim().toLowerCase()
  const filtered = useMemo(() => {
    return vendors.filter(v => {
      const blob = `${v.company} ${v.type} ${v.hrName} ${v.email} ${v.phone} ${v.skills} ${v.hiring} ${v.mode} ${v.status}`.toLowerCase()
      const matchesQuery = (!query || blob.includes(query)) && (!qLocal || blob.includes(qLocal))
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Active' && v.status === 'Active') ||
        (filter === 'On-hold' && v.status === 'On-hold') ||
        (filter === 'IT Firm' && v.type === 'IT Firm') ||
        (filter === 'Training Institute' && v.type === 'Training Institute')
      return matchesQuery && matchesFilter
    })
  }, [vendors, query, qLocal, filter])

  function handleCardAction(action, v) {
    if (action === 'delete') {
      if (!confirm('Delete this vendor?')) return
      deleteVendor(v.id).then(() => setVendors(cur => cur.filter(x => x.id !== v.id)))
      return
    }
    if (action === 'active') {
      updateVendor(v.id, { ...v, status: 'Active' }).then(res => setVendors(cur => cur.map(x => x.id === v.id ? res : x)))
      return
    }
    if (action === 'hold') {
      updateVendor(v.id, { ...v, status: 'On-hold' }).then(res => setVendors(cur => cur.map(x => x.id === v.id ? res : x)))
      return
    }
    if (action === 'edit') {
      setModalOpen(true)
    }
  }

  function handleCreate(form) {
    createVendor({ ...form }).then(v => {
      setVendors(cur => [v, ...cur])
      setModalOpen(false)
    })
  }

  return (
    <>
      <div className="hero-card">
        <div>
          <h2>Vendor Management</h2>
          <p>Manage vendor profiles generated from trainer data and oversee related operations !</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <span className="btn-icon">+</span>
          <span>Add Vendor</span>
        </button>
      </div>
      <div className="filters">
        <div className="filters-title">Vendor Search & Filters</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} type="text" placeholder="Search here..." />
          </label>
          <label>
            <span>Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>On-hold</option>
              <option>IT Firm</option>
              <option>Training Institute</option>
            </select>
          </label>
        </div>
      </div>
      <div className="vendor-section">
        <div className="vendor-title">VENDOR LIST ({filtered.length.toString().padStart(2, '0')})</div>
        <div className="vendor-list">
          {filtered.map(v => (
            <VendorCard key={v.id} v={v} onAction={handleCardAction} />
          ))}
        </div>
      </div>
      <AddVendorModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </>
  )
}
