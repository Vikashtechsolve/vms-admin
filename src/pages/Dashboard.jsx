export default function Dashboard() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate()
  const firstDay = new Date(year, today.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const highlighted = [5, 6, 7, 13, 14, 20, 21, 27, 28]
  const currentDay = today.getDate()

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
            <h2>— VMS Dashboard</h2>
            <p>Managing Trainers & Vendors data and overseeing manpower operations!</p>
          </div>
        </div>
      </div>
      <div className="dashboard-stats-row">
        <div className="stat-cards">
          <Stat title="Number of Trainers" value="50" />
          <Stat title="Number of Vendors" value="60" />
          <Stat title="Active Trainers" value="40" />
        </div>
        <div className="dashboard-calendar">
          <div className="calendar-header">
            <span className="calendar-title">{month} {year}</span>
            <div className="calendar-nav">
              <button type="button" aria-label="Previous month">‹</button>
              <button type="button" aria-label="Next month">›</button>
            </div>
          </div>
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="calendar-grid">
            {Array(firstDay).fill(0).map((_, i) => <span key={`pad-${i}`} className="calendar-day empty" />)}
            {days.map((d) => (
              <span
                key={d}
                className={`calendar-day ${highlighted.includes(d) ? 'highlight' : ''} ${d === currentDay ? 'today' : ''}`}
              >
                {d}
              </span>
            ))}
          </div>
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
