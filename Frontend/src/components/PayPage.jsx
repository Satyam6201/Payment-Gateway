import { useState } from 'react'
import { API_URL } from '../api'
import { IconCreditCard, IconRefresh, IconShield } from './icons'
import './PayPage.css'

export default function PayPage({ user }) {
  const [amount, setAmount] = useState('50')
  const [currency, setCurrency] = useState('usd') // 'usd' | 'inr' only
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  // Only USD and Rupees (INR)
  const currencies = [
    { code: 'usd', symbol: '$', name: 'USD ($)' },
    { code: 'inr', symbol: '₹', name: 'Rupees (₹)' },
  ]

  const activeCurrency = currencies.find((c) => c.code === currency) || currencies[0]
  const numericAmount = Number(amount) || 0

  const handlePayWithStripe = async (e) => {
    e.preventDefault()
    setStatus(null)

    if (!numericAmount || numericAmount <= 0) {
      setStatus({ type: 'error', text: 'Enter a valid amount' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/order/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          amount: numericAmount,
          currency,
          note: note.trim() || undefined,
          orderId: `order_${Date.now()}`,
        }),
      })

      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setStatus({ type: 'error', text: data.message || 'Payment failed' })
      }
    } catch {
      setStatus({ type: 'error', text: 'Server unreachable' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="simple-pay-wrapper">
      <div className="simple-card">
        <div className="simple-card-header">
          <h2 className="simple-card-title">Make a Payment</h2>
          <p className="simple-card-sub">Secure online checkout powered by Stripe</p>
        </div>

        {status && (
          <div className={`simple-alert ${status.type}`}>
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handlePayWithStripe} className="simple-form">
          {/* Currency Choice: USD or Rupees only */}
          <div className="form-field">
            <label className="field-label">Select Currency</label>
            <div className="toggle-group">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`toggle-btn ${currency === c.code ? 'active' : ''}`}
                  onClick={() => setCurrency(c.code)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Field */}
          <div className="form-field">
            <label htmlFor="amount-input" className="field-label">Payment Amount</label>
            <div className="amount-input-box">
              <span className="currency-prefix">{activeCurrency.symbol}</span>
              <input
                id="amount-input"
                type="number"
                min="1"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="simple-input amount-field"
                required
              />
            </div>
          </div>

          {/* Optional Note */}
          <div className="form-field">
            <label htmlFor="note-input" className="field-label">Note / Purpose (Optional)</label>
            <input
              id="note-input"
              type="text"
              placeholder="What is this payment for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="simple-input"
            />
          </div>

          {/* Stripe Pay Action */}
          <button
            type="submit"
            disabled={loading || !numericAmount || numericAmount <= 0}
            className="btn-primary btn-block"
          >
            {loading ? (
              <span className="btn-loading">
                <IconRefresh size={16} className="spin" />
                <span>Redirecting to Stripe...</span>
              </span>
            ) : (
              <span className="btn-content-flex">
                <IconCreditCard size={17} />
                <span>Pay {activeCurrency.symbol}{numericAmount || '0'} with Stripe</span>
              </span>
            )}
          </button>

          <div className="stripe-secure-notice">
            <IconShield size={14} />
            <span>End-to-end encrypted 256-bit checkout via Stripe</span>
          </div>
        </form>
      </div>
    </div>
  )
}