import { useEffect, useMemo, useState, useRef } from 'react'
import { createVendor, deleteVendor, getVendors, updateVendor } from '../services/api.js'

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

function VendorCard({ v, onAction }) {
  const initials = (v.company || '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const hasLogo = v.logo && String(v.logo).trim()
  const [logoError, setLogoError] = useState(false)
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

export default function Vendors({ globalSearch }) {
  const [vendors, setVendors] = useState([])
  const [modalOpen, setModalOpen] = useState(null) // null = closed, 'add' = add, vendor = edit
  const [localQuery, setLocalQuery] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    getVendors().then(setVendors).catch(() => {})
  }, [])

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
    createVendor(form)
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

  return (
    <>
      <div className="hero-card hero-card-vendor">
        <div>
          <h2>Vendor Management</h2>
          <p>Manage vendor profiles generated from trainer data and oversee related operations!</p>
        </div>
        <button type="button" className="add-vendor-figma" onClick={() => setModalOpen('add')} aria-label="Add Vendor">
          <span className="add-vendor-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="add-vendor-label">Add Vendor</span>
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
        <div className="vendor-title">VENDOR LIST ({String(filtered.length).padStart(2, '0')})</div>
        <div className="vendor-list">
          {filtered.map((v) => (
            <VendorCard key={v.id} v={v} onAction={handleAction} />
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
    </>
  )
}
