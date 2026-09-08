import { useState } from 'react'
import { API_URL } from '../api'
import { IconWallet, IconCreditCard, IconCheckCircle, IconDownload, IconRefresh } from './icons'
import './PayPage.css'

export default function PayPage({ user }) {
  const [method, setMethod] = useState('direct') // 'direct' | 'stripe'
  const [amount, setAmount] = useState('50')
  const [currency, setCurrency] = useState('usd') // 'usd' | 'inr' only
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [receipt, setReceipt] = useState(null)

  // Only USD and Rupees (INR)
  const currencies = [
    { code: 'usd', symbol: '$', name: 'USD ($)' },
    { code: 'inr', symbol: '₹', name: 'Rupees (₹)' },
  ]

  const activeCurrency = currencies.find((c) => c.code === currency) || currencies[0]
  const numericAmount = Number(amount) || 0

  const handleDownloadReceipt = () => {
    if (!receipt) return
    const text = `PAYMENT RECEIPT
--------------------------------------
Transaction ID : ${receipt._id || receipt.id}
Order ID       : ${receipt.orderId || 'N/A'}
Date           : ${new Date(receipt.paidAt || receipt.createdAt || Date.now()).toLocaleString()}
Payer          : ${user.name} (${user.email})
Amount         : ${activeCurrency.symbol}${Number(receipt.amount).toFixed(2)} ${currency.toUpperCase()}
Status         : ${receipt.status?.toUpperCase() || 'PAID'}
Method         : ${method === 'stripe' ? 'Stripe Checkout' : 'Direct Transfer'}
--------------------------------------`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt_${receipt.orderId || 'payment'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePay = async (e) => {
    e.preventDefault()
    setStatus(null)

    if (!numericAmount || numericAmount <= 0) {
      setStatus({ type: 'error', text: 'Please enter a valid amount greater than 0.' })
      return
    }

    setLoading(true)

    if (method === 'stripe') {
      try {
        const res = await fetch(`${API_URL}/api/order/stripe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            amount: numericAmount,
            currency,
            orderId: `order_${Date.now()}`,
          }),
        })
        const data = await res.json()
        if (data.success && data.url) {
          window.location.href = data.url
        } else {
          setStatus({ type: 'error', text: data.message || 'Unable to start Stripe checkout.' })
        }
      } catch {
        setStatus({ type: 'error', text: 'Cannot reach backend server. Please check your connection.' })
      } finally {
        setLoading(false)
      }
      return
    }

    // Direct Instant Payment
    try {
      const res = await fetch(`${API_URL}/api/order/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          amount: numericAmount,
          currency,
          note: note.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setStatus({ type: 'error', text: data.message || 'Payment could not be processed.' })
        return
      }

      setReceipt(data.payment)
      setStatus({ type: 'success', text: `Payment of ${activeCurrency.symbol}${numericAmount} completed successfully.` })
    } catch {
      setStatus({ type: 'error', text: 'Connection failed. Please ensure backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setReceipt(null)
    setStatus(null)
    setAmount('50')
    setNote('')
  }

  return (
    <div className="simple-pay-wrapper">
      {/* If payment succeeded, show clean receipt */}
      {receipt ? (
        <div className="simple-card receipt-card">
          <div className="receipt-success-icon">
            <IconCheckCircle size={44} />
          </div>
          <h2 className="simple-card-title">Payment Successful</h2>
          <p className="simple-card-sub">Your payment has been recorded in the database.</p>

          <div className="receipt-amount-box">
            <span className="receipt-sym">{activeCurrency.symbol}</span>
            <span className="receipt-num">{Number(receipt.amount).toFixed(2)}</span>
            <span className="receipt-curr">{currency.toUpperCase()}</span>
          </div>

          <div className="receipt-details-list">
            <div className="receipt-row">
              <span className="receipt-row-label">Transaction ID</span>
              <span className="receipt-row-val mono">{receipt._id || receipt.id}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-row-label">Order Reference</span>
              <span className="receipt-row-val mono">{receipt.orderId || 'N/A'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-row-label">Payer</span>
              <span className="receipt-row-val">{user.name}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-row-label">Status</span>
              <span className="receipt-status-pill">Paid</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-row-label">Method</span>
              <span className="receipt-row-val">{method === 'stripe' ? 'Stripe Checkout' : 'Direct Pay'}</span>
            </div>
          </div>

          <div className="receipt-btn-group">
            <button type="button" className="btn-secondary" onClick={handleDownloadReceipt}>
              <IconDownload size={16} />
              <span>Download Receipt</span>
            </button>
            <button type="button" className="btn-primary" onClick={resetForm}>
              Make Another Payment
            </button>
          </div>
        </div>
      ) : (
        /* Simple Payment Form Card */
        <div className="simple-card">
          <div className="simple-card-header">
            <h2 className="simple-card-title">Make a Payment</h2>
            <p className="simple-card-sub">Simple and secure transactions</p>
          </div>

          {status && (
            <div className={`simple-alert ${status.type}`}>
              <span>{status.text}</span>
            </div>
          )}

          <form onSubmit={handlePay} className="simple-form">
            {/* Currency Choice: USD vs Rupees only */}
            <div className="form-field">
              <label className="field-label">Currency</label>
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

            {/* Payment Method Choice */}
            <div className="form-field">
              <label className="field-label">Payment Method</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${method === 'direct' ? 'active' : ''}`}
                  onClick={() => setMethod('direct')}
                >
                  <IconWallet size={16} />
                  <span>Instant Pay</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${method === 'stripe' ? 'active' : ''}`}
                  onClick={() => setMethod('stripe')}
                >
                  <IconCreditCard size={16} />
                  <span>Stripe (Card)</span>
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div className="form-field">
              <label htmlFor="amount-input" className="field-label">Amount</label>
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
              <label htmlFor="note-input" className="field-label">Note (Optional)</label>
              <input
                id="note-input"
                type="text"
                placeholder="What is this payment for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="simple-input"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading || !numericAmount || numericAmount <= 0}
              className="btn-primary btn-block"
            >
              {loading ? (
                <span className="btn-loading">
                  <IconRefresh size={16} className="spin" />
                  <span>Processing...</span>
                </span>
              ) : method === 'stripe' ? (
                `Pay ${activeCurrency.symbol}${numericAmount || '0'} with Stripe`
              ) : (
                `Pay ${activeCurrency.symbol}${numericAmount || '0'}`
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}