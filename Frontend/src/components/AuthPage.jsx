import { useState } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'
import { IconShield, IconSparkles, IconEye, IconEyeOff, IconCheck, IconArrowRight } from './icons'
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
    setStatus({ type: 'info', text: 'Admin demo credentials filled! Click "Sign In" below.' })
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
        setStatus({ type: 'error', text: data.message || 'Authentication failed. Please check credentials.' })
        return
      }
      onLogin(data.user)
    } catch {
      setStatus({ type: 'error', text: 'Unable to connect to backend server. Make sure the server is running.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      {/* Background Decorative Gradient Orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <div className="auth-card-modern">
        {/* Card Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <IconSparkles size={16} />
            <span>Assignment Pay</span>
          </div>

          <h1 className="auth-title">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create an account to start sending & managing seamless payments.'
              : 'Sign in to access your transactions, cards, and analytics.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-modern">
          {isRegister && (
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Alex Johnson"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <div className="label-flex">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="input-pw-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <button type="submit" className="btn-modern-primary" disabled={loading}>
            {loading ? (
              <span className="spinner-wrap">
                <span className="mini-spinner"></span>
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="btn-content">
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <IconArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Pill */}
        <div className="demo-box-modern">
          <div className="demo-text">
            <span className="demo-title">Exploring the Platform?</span>
            <span className="demo-desc">Instant access to the admin analytics hub.</span>
          </div>
          <button type="button" className="btn-demo-autofill" onClick={fillAdmin}>
            <IconSparkles size={14} />
            <span>Fill Demo Admin</span>
          </button>
        </div>

        {/* Status Notification */}
        {status && (
          <div className={`status-banner ${status.type}`}>
            {status.type === 'error' && <span className="status-dot error"></span>}
            {status.type === 'info' && <span className="status-dot info"></span>}
            <span>{status.text}</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="auth-footer-toggle">
          <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            className="link-toggle"
            onClick={() => {
              setIsRegister(!isRegister)
              setStatus(null)
            }}
          >
            {isRegister ? 'Sign in instead' : 'Create one now'}
          </button>
        </div>

        {/* Trust Badges */}
        <div className="trust-footer">
          <span className="trust-item"><IconShield size={13} /> 256-Bit Encrypted</span>
          <span className="trust-dot">•</span>
          <span className="trust-item"><IconCheck size={13} /> Verified Relational DB</span>
        </div>
      </div>
    </div>
  )
}