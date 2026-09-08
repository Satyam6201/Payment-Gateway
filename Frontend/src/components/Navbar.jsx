import { ADMIN_EMAIL } from '../api'
import { IconWallet, IconHistory, IconShield, IconLogOut } from './icons'
import './Navbar.css'

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const initials = (user?.name || 'U').charAt(0).toUpperCase()

  return (
    <header className="simple-navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => setActiveTab('pay')}>
          Assignment<span className="brand-accent">Pay</span>
        </div>

        <nav className="navbar-nav">
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'pay' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay')}
          >
            <IconWallet size={15} />
            <span>Pay</span>
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'my-payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-payments')}
          >
            <IconHistory size={15} />
            <span>My Payments</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <IconShield size={15} />
              <span>Admin</span>
            </button>
          )}
        </nav>

        <div className="navbar-user">
          <div className="user-badge">
            <span className="avatar-circle">{initials}</span>
            <span className="user-display-name">{user?.name}</span>
          </div>

          <button
            type="button"
            className="btn-simple-logout"
            onClick={onLogout}
            title="Sign Out"
          >
            <IconLogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}