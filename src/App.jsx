import './App.css'
import { useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import Vendors from './pages/Vendors.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Trainers from './pages/Trainers.jsx'
import JobPost from './pages/JobPost.jsx'

function Shell({ children, onSearch }) {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const title = useMemo(() => {
    if (location.pathname === '/vendors') return 'Vendor Records'
    if (location.pathname === '/trainers') return 'Trainer Records'
    if (location.pathname === '/jobs') return 'Job Post'
    return 'Dashboard'
  }, [location.pathname])

  return (
    <div className="app">
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">VMS</div>
            <div className="brand-sub">VENDOR MANAGEMENT SYSTEM</div>
          </div>
          <nav className="menu">
            <Link className={`menu-item ${location.pathname==='/' ? 'active' : ''}`} to="/">
              <span className="menu-icon" aria-hidden="true" />
              Dashboard
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/trainers') ? 'active' : ''}`} to="/trainers">
              <span className="menu-icon" aria-hidden="true" />
              Trainer Records
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/vendors') ? 'active' : ''}`} to="/vendors">
              <span className="menu-icon" aria-hidden="true" />
              Vendor Records
            </Link>
            <Link className={`menu-item ${location.pathname.startsWith('/jobs') ? 'active' : ''}`} to="/jobs">
              <span className="menu-icon" aria-hidden="true" />
              Job Post
            </Link>
          </nav>
        </aside>
        <main className="main">
          <header className="topbar">
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
            <button className="icon-button" aria-label="Notifications">
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
    { color: 'yellow', text: 'Vendor profile created from approved trainer data', time: '2 hours ago' },
    { color: 'pink', text: 'Vendor status updated to Active', time: '3 hours ago' },
    { color: 'blue', text: 'Vendor contact details updated by admin', time: '4 hours ago' },
    { color: 'purple', text: 'Vendor assigned to an upcoming training session', time: '5 hours ago' },
    { color: 'red', text: 'Vendor moved to On-hold pending document verification', time: '6 hours ago' },
  ])
  return (
    <>
      <div className="activity-header">
        <div>
          <div className="activity-title">Recent Activities</div>
        </div>
        <button className="more-button light" aria-label="More">⋯</button>
      </div>
      <div className="activity-sub">Today</div>
      <ul className="activity-list">
        {items.map((it, i) => (
          <li key={i}>
            <span className={`activity-icon ${it.color}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" fill="none" strokeWidth="1.6" />
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
