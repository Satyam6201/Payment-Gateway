import { useState } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'

export default function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const fillAdmin = () => {
    setIsRegister(false)
    setForm({ name: '', email: ADMIN_EMAIL, password: 'Satyam@62' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)

    const endpoint = isRegister ? '/api/user/register' : '/api/user/login'
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) {
        setStatus({ type: 'error', text: data.message || 'Authentication failed' })
        return
      }
      onLogin(data.user)
    } catch {
      setStatus({ type: 'error', text: 'Cannot connect to backend server' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? 'Create an Account' : 'Sign In'}</h2>
        <p className="subtitle">
          {isRegister ? 'Register to start making payments' : 'Sign in to access your payments'}
        </p>

        <form onSubmit={handleSubmit} className="form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="demo-box">
          <span>Admin Login:</span>
          <button type="button" className="btn-sm" onClick={fillAdmin}>
            Autofill (satyam@gmail.com)
          </button>
        </div>

        {status && <div className={`alert ${status.type}`}>{status.text}</div>}

        <div className="auth-toggle">
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setIsRegister(!isRegister)
              setStatus(null)
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  )
}