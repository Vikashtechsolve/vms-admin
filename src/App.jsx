import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { getActivities } from './services/api.js'
import Login from './pages/Login.jsx'
import Vendors from './pages/Vendors.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Trainers from './pages/Trainers.jsx'
import JobPost from './pages/JobPost.jsx'
import ImportantLinks from './pages/ImportantLinks.jsx'
import ContactMessages from './pages/ContactMessages.jsx'
import AdminBrand from './components/AdminBrand.jsx'

const MenuIcons = {
  dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  trainers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  vendors: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  jobs: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  links: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  contact: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
}

function Shell({ children, onSearch, user, onLogout }) {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = useMemo(() => {
    if (location.pathname === '/vendors') return 'Vendor Records'
    if (location.pathname === '/trainers') return 'Trainer Records'
    if (location.pathname === '/jobs') return 'Job Post'
    if (location.pathname === '/links') return 'Important Links'
    if (location.pathname === '/contact') return 'Contact Messages'
    return 'Dashboard'
  }, [location.pathname])

  return (
    <div className="app">
      <div className="dashboard-shell">
        <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <AdminBrand showAdminBadge />
          </div>
          <nav className="menu">
            <Link className={`menu-item ${location.pathname === '/' ? 'active' : ''}`} to="/" title="Dashboard" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.dashboard()}</span>
              <span className="menu-label">Dashboard</span>
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/trainers') ? 'active' : ''}`} to="/trainers" title="Trainer Records" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.trainers()}</span>
              <span className="menu-label">Trainer Records</span>
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/vendors') ? 'active' : ''}`} to="/vendors" title="Vendor Records" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.vendors()}</span>
              <span className="menu-label">Vendor Records</span>
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/jobs') ? 'active' : ''}`} to="/jobs" title="Job Post" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.jobs()}</span>
              <span className="menu-label">Job Post</span>
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/links') ? 'active' : ''}`} to="/links" title="Important Links" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.links()}</span>
              <span className="menu-label">Important Links</span>
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/contact') ? 'active' : ''}`} to="/contact" title="Contact Messages" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.contact()}</span>
              <span className="menu-label">Contact Messages</span>
            </Link>
          </nav>
        </aside>
        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
              <h1 className="topbar-title">{title}</h1>
            </div>
            <div className="topbar-center">
              <div className="search">
                <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" strokeWidth="2" fill="none" />
                  <path d="M16.5 16.5L21 21" strokeWidth="2" fill="none" />
                </svg>
                <input
                  type="text"
                  placeholder="Search here..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    onSearch?.(e.target.value)
                  }}
                />
              </div>
            </div>
            <div className="topbar-right">
              <div className="profile">
                <div className="profile-avatar" aria-hidden="true">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="profile-meta">
                  <div className="profile-name">{user?.name || 'Admin'}</div>
                  <div className="profile-role">
                    <span className="status-dot" />
                    Admin
                  </div>
                </div>
                <button type="button" className="btn-logout" onClick={onLogout} aria-label="Logout" title="Logout">
                  Logout
                </button>
              </div>
            </div>
          </header>
          <section className="content">{children}</section>
        </main>
        <aside className="activity">
          <ActivityPanel />
        </aside>
      </div>
    </div>
  )
}

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ActivityPanel() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const selectedKey = toDateKey(selectedDate)
  useEffect(() => {
    setLoading(true)
    getActivities(selectedKey)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [selectedKey])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleString('default', { month: 'short' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
  const isSelected = (d) => selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))

  const handleDayClick = (d) => {
    setSelectedDate(new Date(year, month, d))
  }

  const filteredItems = items
  const selectedLabel = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="activity-panel-inner">
      <div className="activity-calendar">
        <div className="calendar-header">
          <span className="calendar-title">{monthName} {year}</span>
          <div className="calendar-nav">
            <button type="button" aria-label="Previous month" onClick={prevMonth}>‹</button>
            <button type="button" aria-label="Next month" onClick={nextMonth}>›</button>
          </div>
        </div>
        <div className="calendar-weekdays">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="calendar-grid">
          {Array(firstDay).fill(0).map((_, i) => <span key={`pad-${i}`} className="calendar-day empty" />)}
          {days.map((d) => (
            <button
              key={d}
              type="button"
              className={`calendar-day ${isToday(d) ? 'today' : ''} ${isSelected(d) ? 'selected' : ''}`}
              onClick={() => handleDayClick(d)}
              aria-label={`Select ${d} ${monthName}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="activity-section">
        <div className="activity-header">
          <div className="activity-title">Activities on {selectedLabel}</div>
          <button className="activity-more" aria-label="More">⋮</button>
        </div>
        <ul className="activity-list">
          {loading ? (
            <li className="activity-empty">Loading…</li>
          ) : filteredItems.length ? filteredItems.map((it, i) => (
            <li key={it.id ?? i}>
              <span className={`activity-icon ${it.color || 'blue'}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                </svg>
              </span>
              <div>
                <div>{it.text}</div>
                <span className="activity-time">{it.time || ''}</span>
              </div>
            </li>
          )) : (
            <li className="activity-empty">No activities for this day</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, logout, ready } = useAuth()
  const [globalSearch, setGlobalSearch] = useState('')

  if (!ready) {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Shell onSearch={setGlobalSearch} user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/vendors" element={<Vendors globalSearch={globalSearch} />} />
        <Route path="/jobs" element={<JobPost />} />
        <Route path="/links" element={<ImportantLinks />} />
        <Route path="/contact" element={<ContactMessages />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Shell>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
