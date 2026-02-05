export default function Dashboard() {
  return (
    <>
      <div className="hero-card">
        <div>
          <h2>“ VMS Dashboard ”</h2>
          <p>Managing Trainers & Vendors data and overseeing manpower operations!</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <Stat title="Number of Trainers" value="50" />
        <Stat title="Number of Vendors" value="60" />
        <Stat title="Active Trainers" value="40" />
      </div>
    </>
  )
}

function Stat({ title, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, minWidth: 200, boxShadow: '0 8px 16px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#fbe4e6', color: '#c7393d' }}>👥</span>
        <div style={{ fontSize: 12, color: '#6d6d73' }}>{title}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 24 }}>{value}</div>
    </div>
  )
}
