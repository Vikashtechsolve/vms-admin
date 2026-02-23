export default function Trainers() {
  return (
    <>
      <div className="hero-card">
        <div>
          <h2>Trainers</h2>
          <p>Manage trainer profiles, verify details, and maintain accurate training records!</p>
        </div>
        <div className="trainer-add-card">
          <span className="trainer-add-icon">+</span>
          <span className="trainer-add-text">Create New Trainer Profile</span>
        </div>
      </div>
      <div className="filters">
        <div className="filters-title">Trainer Search & Filters</div>
        <div className="filters-row">
          <label>
            <span>Search By Name</span>
            <input type="text" placeholder="Search..." />
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
            <article key={i} className="vendor-card trainer-card">
              <div className="trainer-avatar">{name.split(' ').map(x => x[0]).join('').toUpperCase()}</div>
              <div className="trainer-card-body">
                <div className="trainer-card-header">
                  <div className="vendor-name">{name.toUpperCase()}</div>
                  <span className="trainer-status-dot" aria-hidden="true" />
                </div>
                <div className="vendor-info">
                  <div className="vendor-meta">
                    Contact Number : 9825145670 <span>Location : Delhi</span>
                  </div>
                  <div className="vendor-meta">Qualification : BCA <span>Subject : Java</span></div>
                  <div className="vendor-meta">Teaching Experience : 3 Year <span>Total Experience : 6 Year</span></div>
                </div>
                <div className="trainer-actions">
                  <a href="#resume" className="trainer-link">View Resume</a>
                  <button type="button" className="trainer-add-comment">
                    <span className="trainer-add-comment-icon">+</span>
                    Add Comment
                  </button>
                </div>
              </div>
              <button className="more-button" aria-label="More options">⋯</button>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
