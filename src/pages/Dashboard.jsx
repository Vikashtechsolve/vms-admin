import { useEffect, useState } from 'react'
import { getDashboardStats } from '../services/api.js'

export default function Dashboard() {
  const [stats, setStats] = useState({ numberOfTrainers: 0, numberOfVendors: 0, activeTrainers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="hero-card">
        <div className="hero-card-inner">
          <span className="hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </span>
          <div>
            <h2>Trainer Adda Dashboard</h2>
            <p>Manage trainers, vendors, and training operations in one place.</p>
          </div>
        </div>
      </div>
      <div className="dashboard-stats-row">
        <div className="stat-cards">
          <Stat title="Number of Trainers" value={loading ? '—' : String(stats.numberOfTrainers)} />
          <Stat title="Number of Vendors" value={loading ? '—' : String(stats.numberOfVendors)} />
          <Stat title="Active Trainers" value={loading ? '—' : String(stats.activeTrainers)} />
        </div>
      </div>
    </>
  )
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        <span className="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <div className="stat-label">{title}</div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
