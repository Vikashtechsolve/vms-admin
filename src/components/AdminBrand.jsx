/**
 * Shared Trainer Adda brand mark for admin (sidebar + login).
 * Logo icon is wide (≈1.4:1) — never force into a square.
 */
export default function AdminBrand({ size = 'default', showAdminBadge = false }) {
  const isCompact = size === 'compact'
  return (
    <div
      className={`admin-brand ${isCompact ? 'admin-brand--compact' : ''}`}
      role="img"
      aria-label="Trainer Adda — Train. Empower. Excel."
    >
      <div className="admin-brand-icon-wrap">
        <img src="/logo-icon.png" alt="" className="admin-brand-icon" draggable={false} />
      </div>
      <div className="admin-brand-text">
        <span className="admin-brand-name">
          Trainer <span className="admin-brand-accent">Adda</span>
        </span>
        <span className="admin-brand-tagline" aria-hidden="true">
          <span className="admin-brand-line admin-brand-line--red" />
          <span className="admin-brand-tagline-text">Train. Empower. Excel.</span>
          <span className="admin-brand-line admin-brand-line--dark" />
        </span>
        {showAdminBadge && <span className="admin-brand-badge">Admin Panel</span>}
      </div>
    </div>
  )
}
