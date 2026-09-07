import { useState } from 'react'
import { API_URL } from '../api'

export default function PayPage({ user }) {
  const [amount, setAmount] = useState('50')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const presets = ['20', '50', '60', '100']

  const handlePay = async (e) => {
    e.preventDefault()
    setStatus(null)

    const val = Number(amount)
    if (!val || val <= 0) {
      setStatus({ type: 'error', text: 'Please enter a valid amount.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/order/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          amount: val,
          currency: 'usd',
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setStatus({ type: 'error', text: data.message || 'Payment failed.' })
        return
      }
      setStatus({ type: 'success', text: `Payment of $${val} successful! Recorded in database.` })
    } catch {
      setStatus({ type: 'error', text: 'Cannot connect to backend server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Make a Payment</h2>
      <p className="subtitle">Logged in as {user.name} ({user.email})</p>

      <form onSubmit={handlePay} className="form">
        <label>Quick Amounts</label>
        <div className="presets">
          {presets.map((p) => (
            <button
              type="button"
              key={p}
              className={`preset-btn ${amount === p ? 'active' : ''}`}
              onClick={() => setAmount(p)}
            >
              ${p}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount ($)</label>
          <input
            id="amount"
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing...' : `Pay $${amount || 0}`}
        </button>
      </form>

      {status && <div className={`alert ${status.type}`}>{status.text}</div>}
    </div>
  )
}