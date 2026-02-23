import './App.css'
import { useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import Vendors from './pages/Vendors.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Trainers from './pages/Trainers.jsx'
import JobPost from './pages/JobPost.jsx'

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
}

function Shell({ children, onSearch }) {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = useMemo(() => {
    if (location.pathname === '/vendors') return 'Vendor Records'
    if (location.pathname === '/trainers') return 'Trainer Records'
    if (location.pathname === '/jobs') return 'Job Post'
    return 'Dashboard'
  }, [location.pathname])

  return (
    <div className="app">
      <div className="dashboard-shell">
        <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <div className="brand-mark"><span className="brand-red">V</span>MS</div>
            <div className="brand-sub">VM MANPOWER SOLUTION</div>
          </div>
          <nav className="menu">
            <Link className={`menu-item ${location.pathname === '/' ? 'active' : ''}`} to="/" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.dashboard()}</span>
              Dashboard
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/trainers') ? 'active' : ''}`} to="/trainers" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.trainers()}</span>
              Trainer Records
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/vendors') ? 'active' : ''}`} to="/vendors" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.vendors()}</span>
              Vendor Records
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/jobs') ? 'active' : ''}`} to="/jobs" onClick={() => setSidebarOpen(false)}>
              <span className="menu-icon">{MenuIcons.jobs()}</span>
              Job Post
            </Link>
          </nav>
        </aside>
        <main className="main">
          <header className="topbar">
            <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <h1 className="topbar-title">{title}</h1>
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
            <button className="icon-button notify" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9a6 6 0 0 1 12 0v4l1.6 2.6c.3.5-.1 1.4-.8 1.4H5.2c-.7 0-1.1-.9-.8-1.4L6 13V9z" strokeWidth="1.6" fill="none" />
                <path d="M9.5 19a2.5 2.5 0 0 0 5 0" strokeWidth="1.6" fill="none" />
              </svg>
            </button>
            <div className="profile">
              <div className="profile-avatar">VD</div>
              <div>
                <div className="profile-name">Vikash Dubey</div>
                <div className="profile-role">
                  <span className="status-dot" />
                  Admin
                </div>
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

function ActivityPanel() {
  const [items] = useState([
    { color: 'red', text: 'New trainer profile submitted via VTS website', time: '1 hour ago' },
    { color: 'pink', text: 'Vendor status updated to Active', time: '2 hours ago' },
    { color: 'yellow', text: 'Vendor profile created from approved trainer data', time: '3 hours ago' },
    { color: 'blue', text: 'Vendor contact details updated by admin', time: '4 hours ago' },
    { color: 'teal', text: 'New user joined the group', time: '5 hours ago' },
  ])
  return (
    <>
      <div className="activity-header">
        <div className="activity-title">Recent Activities</div>
        <button className="activity-more" aria-label="More">⋮</button>
      </div>
      <div className="activity-sub">Today</div>
      <ul className="activity-list">
        {items.map((it, i) => (
          <li key={i}>
            <span className={`activity-icon ${it.color}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" fill="currentColor" />
              </svg>
            </span>
            <div>
              <div>{it.text}</div>
              <span className="activity-time">{it.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function App() {
  const [globalSearch, setGlobalSearch] = useState('')
  return (
    <BrowserRouter>
      <Shell onSearch={setGlobalSearch}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/vendors" element={<Vendors globalSearch={globalSearch} />} />
          <Route path="/jobs" element={<JobPost />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

export default App
