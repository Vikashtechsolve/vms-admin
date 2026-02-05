export default function Trainers() {
  return (
    <>
      <div className="hero-card">
        <div>
          <h2>Trainers</h2>
          <p>Manage trainer profiles, verify details, and maintain accurate training records.</p>
        </div>
        <button className="btn btn-primary">
          <span className="btn-icon">+</span>
          <span>Add New Trainer</span>
        </button>
      </div>
      <div className="filters">
        <div className="filters-title">Trainer Search & Filters</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input type="text" placeholder="Search here..." />
          </label>
          <label>
            <span>Filter</span>
            <select>
              <option>Filter by</option>
            </select>
          </label>
        </div>
      </div>
      <div className="vendor-section">
        <div className="vendor-title">TRAINER LIST (03)</div>
        <div className="vendor-list">
          {['Akash Rajput', 'Prakash Jain', 'Rahul Desai'].map((name, i) => (
            <article key={i} className="vendor-card">
              <div className="vendor-logo">{name.split(' ').map(x=>x[0]).join('').toUpperCase()}</div>
              <div className="vendor-info">
                <div className="vendor-name">{name}</div>
                <div className="vendor-meta">
                  Contact Number : 9825145670 <span>Location : Delhi</span>
                </div>
                <div className="vendor-meta">Qualification : BCA <span>Subject : Java</span></div>
                <div className="vendor-meta">Teaching Experience : 3 Year <span>Total Experience : 6 Year</span></div>
              </div>
              <button className="more-button" aria-label="More options">⋯</button>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
