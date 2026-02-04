import './App.css'

function App() {
  return (
    <div className="app">
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">VMS</div>
            <div className="brand-sub">VENDOR MANAGEMENT SYSTEM</div>
          </div>
          <nav className="menu">
            <button className="menu-item">
              <span className="menu-icon" aria-hidden="true" />
              Dashboard
            </button>
            <button className="menu-item">
              <span className="menu-icon" aria-hidden="true" />
              Trainer Records
            </button>
            <button className="menu-item active">
              <span className="menu-icon" aria-hidden="true" />
              Vendor Records
            </button>
            <button className="menu-item">
              <span className="menu-icon" aria-hidden="true" />
              Job Post
            </button>
          </nav>
        </aside>

        <main className="main">
          <header className="topbar">
            <h1 className="topbar-title">Dashboard</h1>
            <div className="search">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="2" fill="none" />
                <path d="M16.5 16.5L21 21" strokeWidth="2" fill="none" />
              </svg>
              <input type="text" placeholder="Search here..." />
            </div>
            <button className="icon-button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 9a6 6 0 0 1 12 0v4l1.6 2.6c.3.5-.1 1.4-.8 1.4H5.2c-.7 0-1.1-.9-.8-1.4L6 13V9z"
                  strokeWidth="1.6"
                  fill="none"
                />
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

          <section className="content">
            <div className="hero-card">
              <div>
                <h2>Vendor Management</h2>
                <p>
                  Manage vendor profiles generated from trainer data and oversee related
                  operations !
                </p>
              </div>
              <button className="add-vendor">
                <span>+</span>
                Add Vendor
              </button>
            </div>

            <div className="filters">
              <div className="filters-title">Vendor Search & Filters</div>
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
              <div className="vendor-title">VENDOR LIST (03)</div>
              <div className="vendor-list">
                <article className="vendor-card">
                  <div className="vendor-logo">ES</div>
                  <div className="vendor-info">
                    <div className="vendor-name">EDU SKILL COMPANY</div>
                    <div className="vendor-meta">
                      Company Type : Training Institute
                      <span>Company Size : 40-50 employees</span>
                    </div>
                    <div className="vendor-meta">
                      HR Name : Riya Kapoor
                      <span>E-mail : riya.2324@gmail.com</span>
                      <span>Contact Number : 9825145670</span>
                    </div>
                    <div className="vendor-meta">
                      Training Skills/Technologies Required : Python, Excel, SQL, Power
                      BI, Tableau
                    </div>
                    <div className="vendor-meta">
                      Hiring Type : Full-Time Trainer
                      <span>Mode : Offline Mode</span>
                    </div>
                  </div>
                  <button className="more-button" aria-label="More options">
                    ⋯
                  </button>
                </article>

                <article className="vendor-card">
                  <div className="vendor-logo blue">AG</div>
                  <div className="vendor-info">
                    <div className="vendor-name">Appz Global Solutions</div>
                    <div className="vendor-meta">
                      Company Type : IT Firm
                      <span>Company Size : 60-80 employees</span>
                    </div>
                    <div className="vendor-meta">
                      HR Name : Priyanka Chopra
                      <span>E-mail : chopra.224@gmail.com</span>
                      <span>Contact Number : 8825145670</span>
                    </div>
                    <div className="vendor-meta">
                      Training Skills/Technologies Required : SEO, Google Ads, Meta Ads,
                      Social Media Marketing
                    </div>
                    <div className="vendor-meta">
                      Hiring Type : Part-Time Trainer
                      <span>Mode : Offline Mode</span>
                    </div>
                  </div>
                  <button className="more-button" aria-label="More options">
                    ⋯
                  </button>
                </article>

                <article className="vendor-card">
                  <div className="vendor-logo green">AF</div>
                  <div className="vendor-info">
                    <div className="vendor-name">Alt+F</div>
                    <div className="vendor-meta">
                      Company Type : IT Firm
                      <span>Company Size : 40-50 employees</span>
                    </div>
                    <div className="vendor-meta">
                      HR Name : Priya Bisht
                      <span>E-mail : priya.2004@gmail.com</span>
                      <span>Contact Number : 7825145670</span>
                    </div>
                    <div className="vendor-meta">
                      Training Skills/Technologies Required : Java, Python, Data
                      Structures & Algorithms, System Design
                    </div>
                    <div className="vendor-meta">
                      Hiring Type : Full-Time Trainer
                      <span>Mode : Offline Mode</span>
                    </div>
                  </div>
                  <button className="more-button" aria-label="More options">
                    ⋯
                  </button>
                </article>
              </div>
            </div>
          </section>
        </main>

        <aside className="activity">
          <div className="activity-header">
            <div>
              <div className="activity-title">Recent Activities</div>
            </div>
            <button className="more-button light" aria-label="More">
              ⋯
            </button>
          </div>
          <div className="activity-sub">Today</div>
          <ul className="activity-list">
            <li>
              <span className="activity-icon yellow">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="9" r="4" fill="none" strokeWidth="1.6" />
                  <path
                    d="M5 20c1.8-3.5 11.2-3.5 14 0"
                    fill="none"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              <div>
                <div>Vendor profile created from approved trainer data</div>
                <span className="activity-time">2 hours ago</span>
              </div>
            </li>
            <li>
              <span className="activity-icon pink">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 12l4 4 8-9" fill="none" strokeWidth="2" />
                </svg>
              </span>
              <div>
                <div>Vendor status updated to Active</div>
                <span className="activity-time">3 hours ago</span>
              </div>
            </li>
            <li>
              <span className="activity-icon blue">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 3h7l4 4v14H7z"
                    fill="none"
                    strokeWidth="1.6"
                  />
                  <path d="M14 3v5h5" fill="none" strokeWidth="1.6" />
                </svg>
              </span>
              <div>
                <div>Vendor contact details updated by admin</div>
                <span className="activity-time">4 hours ago</span>
              </div>
            </li>
            <li>
              <span className="activity-icon purple">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="9" r="3" fill="none" strokeWidth="1.6" />
                  <circle cx="16" cy="10" r="2.5" fill="none" strokeWidth="1.6" />
                  <path d="M4 20c1.2-3 8.8-3 10 0" fill="none" strokeWidth="1.6" />
                  <path d="M14 18c.6-1.6 4.4-1.6 5 0" fill="none" strokeWidth="1.6" />
                </svg>
              </span>
              <div>
                <div>Vendor assigned to an upcoming training session</div>
                <span className="activity-time">5 hours ago</span>
              </div>
            </li>
            <li>
              <span className="activity-icon red">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" fill="none" strokeWidth="1.6" />
                  <path d="M8 8l8 8" fill="none" strokeWidth="1.6" />
                </svg>
              </span>
              <div>
                <div>Vendor moved to On-hold pending document verification</div>
                <span className="activity-time">6 hours ago</span>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default App
