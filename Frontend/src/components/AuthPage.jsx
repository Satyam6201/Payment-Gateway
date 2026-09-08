import { useState } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'
import { IconEye, IconEyeOff, IconRefresh } from './icons'
import './AuthPage.css'

export default function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const fillAdmin = () => {
    setIsRegister(false)
    setForm({ name: '', email: ADMIN_EMAIL, password: 'Satyam@62' })
    setStatus({ type: 'info', text: 'Demo credentials filled.' })
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
        setStatus({ type: 'error', text: data.message || 'Authentication failed.' })
        return
      }
      onLogin(data.user)
    } catch {
      setStatus({ type: 'error', text: 'Server unreachable.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="simple-auth-wrapper">
      <div className="simple-auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">Stripe Pay</h1>
          <h2 className="auth-title">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          <p className="auth-sub">
            {isRegister ? 'Register to start sending payments' : 'Enter your credentials to continue'}
          </p>
        </div>

        {status && (
          <div className={`auth-alert ${status.type}`}>
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="name" className="auth-label">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password" className="auth-label">Password</label>
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">
                <IconRefresh size={16} className="spin" />
                <span>Please wait...</span>
              </span>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Demo Account Box */}
        <div className="demo-box">
          <span className="demo-hint">Need a demo admin account?</span>
          <button type="button" className="btn-demo-fill" onClick={fillAdmin}>
            Autofill Admin
          </button>
        </div>

        {/* Switch mode */}
        <div className="auth-switch">
          <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            className="btn-switch-mode"
            onClick={() => {
              setIsRegister(!isRegister)
              setStatus(null)
            }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}