import { ADMIN_EMAIL } from '../api'

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('pay')}>
        Assignment Pay
      </div>

      <nav className="nav-links">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'pay' ? 'active' : ''}`}
          onClick={() => setActiveTab('pay')}
        >
          Pay
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'my-payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-payments')}
        >
          My Payments
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`nav-tab admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Panel
          </button>
        )}
      </nav>

      <div className="nav-user">
        <span className="user-info">
          {user?.name} {isAdmin && <span className="badge-admin">Admin</span>}
        </span>
        <button type="button" className="btn-logout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  )
}