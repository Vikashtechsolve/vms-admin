import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardOverview } from '../services/api.js'

const TABS = [
  { id: 'trainers', label: 'Trainer Records', link: '/trainers' },
  { id: 'trainer-registrations', label: 'Trainer Registrations', link: '/trainer-registrations' },
  { id: 'vendors', label: 'Vendor Records', link: '/vendors' },
  { id: 'vendor-registrations', label: 'Vendor Registrations', link: '/vendor-registrations' },
  { id: 'jobs', label: 'Jobs', link: '/jobs' },
  { id: 'messages', label: 'Messages', link: '/contact' },
]

function tabCount(stats, tabId) {
  if (!stats) return 0
  switch (tabId) {
    case 'trainers': return stats.trainers?.records ?? 0
    case 'trainer-registrations': return stats.trainers?.registrations ?? 0
    case 'vendors': return stats.vendors?.records ?? 0
    case 'vendor-registrations': return stats.vendors?.registrations ?? 0
    case 'jobs': return stats.jobs?.total ?? 0
    case 'messages': return stats.contacts?.total ?? 0
    default: return 0
  }
}

const AVATAR_COLORS = ['#C1272D', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777']

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatLocation(item) {
  if (item.city && item.state && item.state !== 'Other') return `${item.city}, ${item.state}`
  if (item.city) return item.city
  return item.location || '—'
}

function StatusBadge({ status, type = 'trainer' }) {
  if (type === 'trainer') {
    if (status === 'available') return <span className="db-badge db-badge--green">Available</span>
    if (status === 'not_available') return <span className="db-badge db-badge--gray">Not Available</span>
    return <span className="db-badge db-badge--muted">Unset</span>
  }
  if (type === 'visibility') {
    const isPublic = status === 'Public'
    return (
      <span className={`db-badge ${isPublic ? 'db-badge--green' : 'db-badge--gray'}`}>
        {isPublic ? 'Public' : 'Private'}
      </span>
    )
  }
  if (type === 'read') {
    return status
      ? <span className="db-badge db-badge--muted">Read</span>
      : <span className="db-badge db-badge--amber">Unread</span>
  }
  if (type === 'pending') {
    return <span className="db-badge db-badge--amber">Pending</span>
  }
  return null
}

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="db-empty-cell">
        <div className="db-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" aria-hidden="true">
            <path d="M9 12h6M9 16h6M7 4h10l3 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          </svg>
          <p>{message}</p>
        </div>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState('trainers')
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getDashboardOverview()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats
  const lists = data?.lists

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  )

  const q = search.trim().toLowerCase()

  const filteredTrainers = useMemo(() => {
    const items = lists?.trainerRecords ?? []
    if (!q) return items
    return items.filter((t) =>
      `${t.name} ${t.email} ${t.contact} ${t.subject} ${formatLocation(t)}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const filteredTrainerRegistrations = useMemo(() => {
    const items = lists?.trainerRegistrations ?? []
    if (!q) return items
    return items.filter((t) =>
      `${t.name} ${t.email} ${t.contact} ${t.subject} ${t.qualification}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const filteredVendorRegistrations = useMemo(() => {
    const items = lists?.vendorRegistrations ?? []
    if (!q) return items
    return items.filter((v) =>
      `${v.company} ${v.email} ${v.phone} ${v.hrName} ${v.type} ${v.skills}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const filteredVendors = useMemo(() => {
    const items = lists?.vendorRecords ?? []
    if (!q) return items
    return items.filter((v) =>
      `${v.company} ${v.email} ${v.phone} ${v.hrName} ${v.type}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const filteredJobs = useMemo(() => {
    const items = lists?.jobs ?? []
    if (!q) return items
    return items.filter((j) =>
      `${j.title} ${j.location} ${j.trainingType} ${j.mode}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const filteredMessages = useMemo(() => {
    const items = lists?.contacts ?? []
    if (!q) return items
    return items.filter((m) =>
      `${m.name} ${m.email} ${m.message} ${m.role}`.toLowerCase().includes(q)
    )
  }, [lists, q])

  const activeTab = TABS.find((t) => t.id === tab)
  const rowCount = {
    trainers: filteredTrainers.length,
    'trainer-registrations': filteredTrainerRegistrations.length,
    vendors: filteredVendors.length,
    'vendor-registrations': filteredVendorRegistrations.length,
    jobs: filteredJobs.length,
    messages: filteredMessages.length,
  }[tab]

  return (
    <div className="db">
      <header className="db-header">
        <div className="db-header-text">
          <p className="db-greeting">{greeting}</p>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-date">{today}</p>
        </div>
        <button type="button" className="db-refresh" onClick={load} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
          Refresh
        </button>
      </header>

      {error && (
        <div className="db-alert" role="alert">
          Failed to load dashboard data. <button type="button" onClick={load}>Try again</button>
        </div>
      )}

      <div className="db-kpis">
        <KpiCard
          label="Trainer Records"
          value={stats?.trainers?.records}
          sub={`${stats?.trainers?.available ?? 0} available`}
          loading={loading}
          to="/trainers"
        />
        <KpiCard
          label="Trainer Registrations"
          value={stats?.trainers?.registrations}
          sub="Pending website sign-ups"
          loading={loading}
          highlight={(stats?.trainers?.registrations ?? 0) > 0}
          to="/trainer-registrations"
        />
        <KpiCard
          label="Vendor Records"
          value={stats?.vendors?.records}
          sub="Approved company records"
          loading={loading}
          to="/vendors"
        />
        <KpiCard
          label="Vendor Registrations"
          value={stats?.vendors?.registrations}
          sub="Pending website sign-ups"
          loading={loading}
          highlight={(stats?.vendors?.registrations ?? 0) > 0}
          to="/vendor-registrations"
        />
        <KpiCard
          label="Job Posts"
          value={stats?.jobs?.total}
          sub={`${stats?.jobs?.public ?? 0} public · ${stats?.jobApplications ?? 0} applications`}
          loading={loading}
          to="/jobs"
        />
        <KpiCard
          label="Contact Messages"
          value={stats?.contacts?.total}
          sub={`${stats?.contacts?.unread ?? 0} unread`}
          loading={loading}
          highlight={(stats?.contacts?.unread ?? 0) > 0}
          to="/contact"
        />
      </div>

      <div className="db-body">
        <section className="db-main">
          <div className="db-panel">
            <div className="db-panel-toolbar">
              <div className="db-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`db-tab ${tab === t.id ? 'db-tab--active' : ''}`}
                    onClick={() => { setTab(t.id); setSearch('') }}
                  >
                    {t.label}
                    {!loading && (
                      <span className={`db-tab-count ${tabCount(stats, t.id) > 0 && (t.id === 'trainer-registrations' || t.id === 'vendor-registrations') ? 'db-tab-count--pending' : ''}`}>
                        {tabCount(stats, t.id)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="db-toolbar-right">
                <div className="db-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                  <input
                    type="search"
                    placeholder={`Search ${activeTab?.label.toLowerCase()}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {activeTab?.link && (
                  <Link to={activeTab.link} className="db-view-all">
                    Open full page →
                  </Link>
                )}
              </div>
            </div>

            <div className="db-table-wrap">
              {loading ? (
                <div className="db-loading">
                  <span className="spinner" />
                  Loading records…
                </div>
              ) : (
                <table className="db-table">
                  <thead>
                    {tab === 'trainers' && (
                      <tr>
                        <th>Trainer</th>
                        <th>Contact</th>
                        <th>Location</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th>Added</th>
                      </tr>
                    )}
                    {tab === 'trainer-registrations' && (
                      <tr>
                        <th>Trainer</th>
                        <th>Contact</th>
                        <th>Qualification / Subject</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    )}
                    {tab === 'vendor-registrations' && (
                      <tr>
                        <th>Company</th>
                        <th>Type</th>
                        <th>HR Contact</th>
                        <th>Email / Phone</th>
                        <th>Skills</th>
                        <th>Submitted</th>
                      </tr>
                    )}
                    {tab === 'vendors' && (
                      <tr>
                        <th>Company</th>
                        <th>Type</th>
                        <th>HR Contact</th>
                        <th>Email / Phone</th>
                        <th>Skills</th>
                        <th>Added</th>
                      </tr>
                    )}
                    {tab === 'jobs' && (
                      <tr>
                        <th>Job Title</th>
                        <th>Visibility</th>
                        <th>Mode</th>
                        <th>Location</th>
                        <th>Training Type</th>
                        <th>Posted</th>
                      </tr>
                    )}
                    {tab === 'messages' && (
                      <tr>
                        <th>From</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Received</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {tab === 'trainers' && (
                      filteredTrainers.length === 0
                        ? <EmptyRow colSpan={6} message="No trainer records yet." />
                        : filteredTrainers.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <div className="db-person">
                                <span className="db-avatar" style={{ background: avatarColor(t.name) }}>{initials(t.name)}</span>
                                <div>
                                  <div className="db-person-name">{t.name || '—'}</div>
                                  <div className="db-person-sub">{t.workLookingFor || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="db-cell-main">{t.email || '—'}</div>
                              <div className="db-cell-sub">{t.contact || '—'}</div>
                            </td>
                            <td>{formatLocation(t)}</td>
                            <td>{t.totalExperience || t.teachingExperience || '—'}</td>
                            <td><StatusBadge status={t.status} type="trainer" /></td>
                            <td className="db-cell-muted">{formatDate(t.createdAt)}</td>
                          </tr>
                        ))
                    )}

                    {tab === 'trainer-registrations' && (
                      filteredTrainerRegistrations.length === 0
                        ? <EmptyRow colSpan={6} message="No trainer registrations yet." />
                        : filteredTrainerRegistrations.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <div className="db-person">
                                <span className="db-avatar" style={{ background: avatarColor(t.name) }}>{initials(t.name)}</span>
                                <div className="db-person-name">{t.name || '—'}</div>
                              </div>
                            </td>
                            <td>
                              <div className="db-cell-main">{t.email || '—'}</div>
                              <div className="db-cell-sub">{t.contact || '—'}</div>
                            </td>
                            <td className="db-cell-truncate">{t.qualification || t.subject || '—'}</td>
                            <td>{t.totalExperience || t.teachingExperience || '—'}</td>
                            <td><StatusBadge type="pending" /></td>
                            <td className="db-cell-muted">{formatDate(t.createdAt)}</td>
                          </tr>
                        ))
                    )}

                    {tab === 'vendor-registrations' && (
                      filteredVendorRegistrations.length === 0
                        ? <EmptyRow colSpan={6} message="No vendor registrations yet." />
                        : filteredVendorRegistrations.map((v) => (
                          <tr key={v.id}>
                            <td>
                              <div className="db-person">
                                <span className="db-avatar" style={{ background: avatarColor(v.company) }}>{initials(v.company)}</span>
                                <div className="db-person-name">{v.company || '—'}</div>
                              </div>
                            </td>
                            <td>{v.type || '—'}</td>
                            <td>{v.hrName || '—'}</td>
                            <td>
                              <div className="db-cell-main">{v.email || '—'}</div>
                              <div className="db-cell-sub">{v.phone || '—'}</div>
                            </td>
                            <td className="db-cell-truncate">{v.skills || '—'}</td>
                            <td className="db-cell-muted">{formatDate(v.createdAt)}</td>
                          </tr>
                        ))
                    )}

                    {tab === 'vendors' && (
                      filteredVendors.length === 0
                        ? <EmptyRow colSpan={6} message="No vendor records yet." />
                        : filteredVendors.map((v) => (
                          <tr key={v.id}>
                            <td>
                              <div className="db-person">
                                <span className="db-avatar" style={{ background: avatarColor(v.company) }}>{initials(v.company)}</span>
                                <div>
                                  <div className="db-person-name">{v.company || '—'}</div>
                                  <div className="db-person-sub">{v.size || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td>{v.type || '—'}</td>
                            <td>{v.hrName || '—'}</td>
                            <td>
                              <div className="db-cell-main">{v.email || '—'}</div>
                              <div className="db-cell-sub">{v.phone || '—'}</div>
                            </td>
                            <td className="db-cell-truncate">{v.skills || '—'}</td>
                            <td className="db-cell-muted">{formatDate(v.createdAt)}</td>
                          </tr>
                        ))
                    )}

                    {tab === 'jobs' && (
                      filteredJobs.length === 0
                        ? <EmptyRow colSpan={6} message="No jobs posted yet." />
                        : filteredJobs.map((j) => (
                          <tr key={j.id}>
                            <td>
                              <div className="db-person-name">{j.title || '—'}</div>
                              <div className="db-cell-sub">{j.experience || j.level || ''}</div>
                            </td>
                            <td><StatusBadge status={j.visibility} type="visibility" /></td>
                            <td>{j.mode || '—'}</td>
                            <td>{j.location || '—'}</td>
                            <td>{j.trainingType || '—'}</td>
                            <td className="db-cell-muted">{formatDate(j.createdAt)}</td>
                          </tr>
                        ))
                    )}

                    {tab === 'messages' && (
                      filteredMessages.length === 0
                        ? <EmptyRow colSpan={6} message="No contact messages yet." />
                        : filteredMessages.map((m) => (
                          <tr key={m.id} className={!m.read ? 'db-row-unread' : ''}>
                            <td>
                              <div className="db-person">
                                <span className="db-avatar" style={{ background: avatarColor(m.name) }}>{initials(m.name)}</span>
                                <div className="db-person-name">{m.name}</div>
                              </div>
                            </td>
                            <td>
                              {m.role
                                ? <span className="db-badge db-badge--muted">{m.role}</span>
                                : '—'}
                            </td>
                            <td>{m.email || '—'}</td>
                            <td className="db-cell-truncate">{m.message || '—'}</td>
                            <td><StatusBadge status={m.read} type="read" /></td>
                            <td className="db-cell-muted">{formatDate(m.createdAt)}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && (
              <div className="db-panel-footer">
                Showing {rowCount} record{rowCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </section>

        <aside className="db-aside">
          <div className="db-aside-card">
            <h3 className="db-aside-title">Attention Required</h3>
            <ul className="db-attention-list">
              <AttentionItem
                label="Trainer registrations"
                count={stats?.trainers?.registrations}
                loading={loading}
                to="/trainer-registrations"
              />
              <AttentionItem
                label="Vendor registrations"
                count={stats?.vendors?.registrations}
                loading={loading}
                to="/vendor-registrations"
              />
              <AttentionItem
                label="Unread messages"
                count={stats?.contacts?.unread}
                loading={loading}
                to="/contact"
              />
            </ul>
          </div>

          <div className="db-aside-card">
            <h3 className="db-aside-title">Trainer Availability</h3>
            <DistributionBar
              loading={loading}
              segments={[
                { label: 'Available', value: stats?.trainers?.available ?? 0, color: '#16A34A' },
                { label: 'Not Available', value: stats?.trainers?.notAvailable ?? 0, color: '#94A3B8' },
                {
                  label: 'Unset',
                  value: Math.max(
                    0,
                    (stats?.trainers?.records ?? 0) -
                      (stats?.trainers?.available ?? 0) -
                      (stats?.trainers?.notAvailable ?? 0)
                  ),
                  color: '#E2E8F0',
                },
              ]}
            />
          </div>

          <div className="db-aside-card">
            <h3 className="db-aside-title">Job Visibility</h3>
            <DistributionBar
              loading={loading}
              segments={[
                { label: 'Public', value: stats?.jobs?.public ?? 0, color: '#2563EB' },
                { label: 'Private', value: stats?.jobs?.private ?? 0, color: '#64748B' },
              ]}
            />
          </div>

          <div className="db-aside-card db-aside-card--links">
            <h3 className="db-aside-title">Quick Links</h3>
            <div className="db-quick-links">
              <Link to="/trainers">Trainer Records</Link>
              <Link to="/trainer-registrations">Trainer Registrations</Link>
              <Link to="/vendors">Vendor Records</Link>
              <Link to="/vendor-registrations">Vendor Registrations</Link>
              <Link to="/jobs">Job Posts</Link>
              <Link to="/links">Important Links ({loading ? '…' : stats?.importantLinks ?? 0})</Link>
              <Link to="/contact">Contact Inbox</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, loading, to, highlight }) {
  const inner = (
    <div className={`db-kpi ${highlight ? 'db-kpi--alert' : ''}`}>
      <span className="db-kpi-label">{label}</span>
      <span className="db-kpi-value">{loading ? '—' : (value ?? 0).toLocaleString('en-IN')}</span>
      <span className="db-kpi-sub">{loading ? 'Loading…' : sub}</span>
    </div>
  )
  if (to) return <Link to={to} className="db-kpi-link">{inner}</Link>
  return inner
}

function AttentionItem({ label, count, loading, to }) {
  const n = count ?? 0
  return (
    <li className={`db-attention-item ${n > 0 ? 'db-attention-item--active' : ''}`}>
      <Link to={to}>
        <span>{label}</span>
        <span className="db-attention-count">{loading ? '…' : n}</span>
      </Link>
    </li>
  )
}

function DistributionBar({ segments, loading }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (loading) return <div className="db-dist-loading">Loading…</div>
  if (total === 0) return <p className="db-dist-empty">No data yet</p>

  return (
    <div className="db-dist">
      <div className="db-dist-bar" role="img" aria-label="Distribution chart">
        {segments.filter((s) => s.value > 0).map((seg) => (
          <div
            key={seg.label}
            className="db-dist-segment"
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
      </div>
      <ul className="db-dist-legend">
        {segments.map((seg) => (
          <li key={seg.label}>
            <span className="db-dist-dot" style={{ background: seg.color }} />
            <span className="db-dist-label">{seg.label}</span>
            <span className="db-dist-val">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
