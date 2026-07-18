import { useEffect, useState, useMemo } from 'react'
import { getContacts, markContactRead, deleteContact } from '../services/api.js'

const ROLE_COLORS = {
  Trainer: { bg: '#EAF2FF', color: '#2563EB' },
  Company: { bg: '#F0FDF4', color: '#16A34A' },
  Other:   { bg: '#FEF3C7', color: '#92400E' },
}

function roleStyle(role) {
  return ROLE_COLORS[role] || { bg: '#F3F4F6', color: '#6B7280' }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444']

function MessageDrawer({ msg, onClose, onDelete, onMarkRead }) {
  if (!msg) return null
  const style = roleStyle(msg.role)
  return (
    <div className="contact-drawer-overlay" onClick={onClose} aria-hidden="true">
      <div className="contact-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="contact-drawer-header">
          <button className="appdrawer-back" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div className="contact-drawer-title">Message</div>
            <div className="contact-drawer-sub">{formatDate(msg.createdAt)}</div>
          </div>
          <div className="contact-drawer-actions">
            {!msg.read && (
              <button className="btn btn-ghost contact-action-btn" onClick={() => onMarkRead(msg)}>
                Mark as Read
              </button>
            )}
            <button className="btn contact-delete-btn" onClick={() => onDelete(msg)}>
              Delete
            </button>
          </div>
        </div>

        <div className="contact-drawer-body">
          {/* Sender info */}
          <div className="contact-sender-card">
            <div className="contact-sender-avatar" style={{ background: AVATAR_COLORS[msg.name.charCodeAt(0) % AVATAR_COLORS.length] }}>
              {getInitials(msg.name)}
            </div>
            <div className="contact-sender-info">
              <div className="contact-sender-name">
                {msg.name}
                {!msg.read && <span className="contact-unread-dot" />}
              </div>
              <div className="contact-sender-meta">
                <a href={`mailto:${msg.email}`} className="contact-meta-link">{msg.email}</a>
                {msg.phone && (
                  <>
                    <span className="appcard-dot" />
                    <a href={`tel:${msg.phone}`} className="contact-meta-link">{msg.phone}</a>
                  </>
                )}
              </div>
              {msg.role && (
                <span className="contact-role-badge" style={{ background: style.bg, color: style.color }}>
                  {msg.role}
                </span>
              )}
            </div>
          </div>

          {/* Message body */}
          <div className="contact-message-body">
            <div className="contact-message-label">Message</div>
            {msg.message ? (
              <p className="contact-message-text">{msg.message}</p>
            ) : (
              <p className="contact-message-empty">No message text provided.</p>
            )}
          </div>

          {/* Quick reply */}
          <a
            href={`mailto:${msg.email}?subject=Re: Your Trainer Adda Contact Request`}
            className="contact-reply-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M3 10h11a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6" />
            </svg>
            Reply via Email
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterRead, setFilterRead] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    getContacts()
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoading(false))
  }

  async function handleMarkRead(msg) {
    await markContactRead(msg.id).catch(() => {})
    setMessages((cur) => cur.map((m) => m.id === msg.id ? { ...m, read: true } : m))
    setSelected((s) => s?.id === msg.id ? { ...s, read: true } : s)
  }

  async function handleDelete(msg) {
    if (!confirm(`Delete message from "${msg.name}"?`)) return
    await deleteContact(msg.id).catch(() => {})
    setMessages((cur) => cur.filter((m) => m.id !== msg.id))
    if (selected?.id === msg.id) setSelected(null)
  }

  async function handleOpen(msg) {
    setSelected(msg)
    if (!msg.read) {
      await markContactRead(msg.id).catch(() => {})
      setMessages((cur) => cur.map((m) => m.id === msg.id ? { ...m, read: true } : m))
      setSelected({ ...msg, read: true })
    }
  }

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      const q = search.trim().toLowerCase()
      if (q && !`${m.name} ${m.email} ${m.phone} ${m.message}`.toLowerCase().includes(q)) return false
      if (filterRole && m.role !== filterRole) return false
      if (filterRead === 'unread' && m.read) return false
      if (filterRead === 'read' && !m.read) return false
      return true
    })
  }, [messages, search, filterRole, filterRead])

  const unreadCount = messages.filter((m) => !m.read).length

  return (
    <>
      <div className="hero-card">
        <div>
          <h2>Contact Messages</h2>
          <p>Enquiries submitted through the public contact form.</p>
        </div>
        {unreadCount > 0 && (
          <div className="contact-unread-badge">{unreadCount} unread</div>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filters-title">Search & Filter</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Name, email, phone or message…"
            />
          </label>
          <label>
            <span>Role</span>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="Trainer">Trainer</option>
              <option value="Company">Company</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filterRead} onChange={(e) => setFilterRead(e.target.value)}>
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </label>
        </div>
      </div>

      {/* Message list */}
      <div className="vendor-section">
        <div className="vendor-title">
          MESSAGES ({String(filtered.length).padStart(2, '0')})
        </div>

        {loading && (
          <div className="contact-state">
            <span className="spinner" />
            Loading messages…
          </div>
        )}
        {!loading && error && (
          <div className="contact-state contact-state-error">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="contact-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="52" height="52">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <p>No messages found</p>
            <span>{search || filterRole || filterRead ? 'Try adjusting your filters' : 'Messages from the contact form will appear here'}</span>
          </div>
        )}

        <div className="contact-list">
          {filtered.map((msg, i) => {
            const style = roleStyle(msg.role)
            const color = AVATAR_COLORS[msg.name.charCodeAt(0) % AVATAR_COLORS.length]
            return (
              <div
                key={msg.id}
                className={`contact-row ${!msg.read ? 'contact-row-unread' : ''}`}
                onClick={() => handleOpen(msg)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOpen(msg)}
              >
                <div className="contact-row-avatar" style={{ background: color }}>
                  {getInitials(msg.name)}
                </div>
                <div className="contact-row-body">
                  <div className="contact-row-top">
                    <span className="contact-row-name">
                      {msg.name}
                      {!msg.read && <span className="contact-unread-dot" />}
                    </span>
                    <span className="contact-row-date">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className="contact-row-email">{msg.email}</div>
                  {msg.message && (
                    <p className="contact-row-preview">{msg.message}</p>
                  )}
                </div>
                {msg.role && (
                  <span className="contact-role-badge" style={{ background: style.bg, color: style.color }}>
                    {msg.role}
                  </span>
                )}
                <button
                  type="button"
                  className="contact-row-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(msg) }}
                  aria-label="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <MessageDrawer
        msg={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onMarkRead={handleMarkRead}
      />
    </>
  )
}
