import { useState } from 'react'
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