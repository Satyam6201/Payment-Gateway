import { ADMIN_EMAIL } from '../api'
import { IconWallet, IconHistory, IconShield, IconLogOut, IconSparkles } from './icons'
import './Navbar.css'

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const initials = (user?.name || 'U').charAt(0).toUpperCase()

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => setActiveTab('pay')}>
          <div className="brand-icon">
            <IconSparkles size={18} />
          </div>
          <span className="brand-text">Assignment<span className="brand-highlight">Pay</span></span>
        </div>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'pay' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay')}
          >
            <IconWallet size={16} />
            <span>Send Money</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'my-payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-payments')}
          >
            <IconHistory size={16} />
            <span>My Activity</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-tab admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <IconShield size={16} />
              <span>Admin Hub</span>
            </button>
          )}
        </nav>

        <div className="nav-user">
          <div className="user-profile-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role-label">
                {isAdmin ? 'Platform Admin' : 'Verified Member'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={onLogout}
            title="Sign out of your account"
          >
            <IconLogOut size={16} />
            <span className="logout-text">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}