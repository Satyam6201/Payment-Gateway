import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import PayPage from './components/PayPage'
import MyPaymentsPage from './components/MyPaymentsPage'
import AdminPanel from './components/AdminPanel'
import AuthPage from './components/AuthPage'
import './App.css'

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('assignment_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [activeTab, setActiveTab] = useState('pay')
  const [notification, setNotification] = useState(null)

  // Handle Stripe callback redirects
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes('/payment/success')) {
      setActiveTab('my-payments')
      setNotification({ type: 'success', text: 'Stripe payment completed successfully!' })
      window.history.replaceState({}, document.title, '/')
    } else if (path.includes('/payment/cancel')) {
      setActiveTab('pay')
      setNotification({ type: 'info', text: 'Stripe checkout was cancelled.' })
      window.history.replaceState({}, document.title, '/')
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('assignment_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('assignment_user')
    setActiveTab('pay')
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <div className="app-root">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {notification && (
        <div style={{ maxWidth: '600px', margin: '16px auto 0', padding: '0 20px', width: '100%' }}>
          <div className={`simple-alert ${notification.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{notification.text}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'pay' && <PayPage user={user} />}
        {activeTab === 'my-payments' && (
          <MyPaymentsPage user={user} onNavigateToPay={() => setActiveTab('pay')} />
        )}
        {activeTab === 'admin' && <AdminPanel user={user} />}
      </main>
    </div>
  )
}