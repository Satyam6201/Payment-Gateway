import { useState, useEffect } from 'react'
import { API_URL } from '../api'
import {
  IconHistory,
  IconSearch,
  IconRefresh,
  IconCopy,
  IconDownload,
  IconClose,
  IconCheck,
  IconWallet
} from './icons'
import './MyPaymentsPage.css'

export default function MyPaymentsPage({ user, onNavigateToPay }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/order/payments?userId=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setPayments(data.payments || [])
      } else {
        setError(data.message || 'Could not load your payment history.')
      }
    } catch {
      setError('Unable to reach payment server. Please check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.id])

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTx = (tx) => {
    const text = `ASSIGNMENT PAY - TRANSACTION RECEIPT
------------------------------------------
Transaction ID : ${tx._id || tx.id}
Order ID       : ${tx.orderId || 'N/A'}
Date & Time    : ${new Date(tx.paidAt || tx.createdAt).toLocaleString()}
Customer       : ${tx.userName || user.name}
Amount         : $${Number(tx.amount).toFixed(2)} ${(tx.currency || 'usd').toUpperCase()}
Status         : ${(tx.status || 'paid').toUpperCase()}
------------------------------------------
Thank you for using Assignment Pay!`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt_${tx.orderId || tx.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Statistics calculation
  const totalSpent = payments
    .filter((p) => p.status === 'paid' || p.status === 'completed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const successfulCount = payments.filter((p) => p.status === 'paid' || p.status === 'completed').length

  // Filter & search
  const filtered = payments.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status?.toLowerCase() === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      (p.orderId || '').toLowerCase().includes(q) ||
      (String(p._id) || '').toLowerCase().includes(q) ||
      (String(p.amount) || '').includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="activity-view-container">
      {/* Overview Cards */}
      <div className="activity-stats-grid">
        <div className="stat-card-gradient primary">
          <div className="stat-card-inner">
            <span className="stat-pill-label">Total Outflow</span>
            <h2 className="stat-giant-num">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span className="stat-subtext">Across {successfulCount} successful payments</span>
          </div>
        </div>

        <div className="stat-card-gradient secondary">
          <div className="stat-card-inner">
            <span className="stat-pill-label">Transactions Made</span>
            <h2 className="stat-giant-num">{payments.length}</h2>
            <span className="stat-subtext">Recorded in MySQL database</span>
          </div>
        </div>

        <div className="stat-card-gradient tertiary">
          <div className="stat-card-inner">
            <span className="stat-pill-label">Account Standing</span>
            <h2 className="stat-giant-num text-success">Good</h2>
            <span className="stat-subtext">Zero failed dispute flags</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-elevated activity-card">
        <div className="activity-header-flex">
          <div>
            <h2 className="section-title">My Payment History</h2>
            <p className="section-subtitle">Real-time ledger of your transfers and card checkouts</p>
          </div>

          <button
            type="button"
            className="btn-action-refresh"
            onClick={fetchPayments}
            disabled={loading}
            title="Refresh transaction history"
          >
            <IconRefresh size={15} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="filter-controls-row">
          <div className="search-input-wrap">
            <IconSearch size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by amount, order ID, or record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
            />
          </div>

          <div className="status-filter-pills">
            {['all', 'paid', 'pending', 'failed'].map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="table-loading-state">
            <span className="mini-spinner"></span>
            <p>Fetching your payment records...</p>
          </div>
        ) : error ? (
          <div className="status-banner error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-human">
            <div className="empty-icon-circle">
              <IconWallet size={32} />
            </div>
            <h3>No Payments Found</h3>
            <p>
              {search || filterStatus !== 'all'
                ? 'No transactions matched your search filters. Try clearing your search.'
                : "You haven't made any payments yet. When you transfer money, your receipts will appear here."}
            </p>
            {onNavigateToPay && (
              <button
                type="button"
                className="btn-empty-pay"
                onClick={onNavigateToPay}
              >
                Make a Payment Now
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Order Reference</th>
                  <th>Record ID</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id || p.id} className="table-row-hover" onClick={() => setSelectedTx(p)}>
                    <td className="cell-date">
                      <span className="date-primary">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="date-secondary">
                        {new Date(p.paidAt || p.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="cell-amount">
                      <span className="amount-badge">
                        ${Number(p.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${p.status}`}>
                        {p.status === 'paid' && <IconCheck size={12} />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="cell-order">
                      <span className="order-tag">{p.orderId || 'Direct'}</span>
                    </td>
                    <td className="cell-id">
                      <code className="id-code-chip">{p._id || p.id}</code>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-view-receipt-sm"
                        onClick={() => setSelectedTx(p)}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Detail & Receipt Modal */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-modal-close"
              onClick={() => setSelectedTx(null)}
              title="Close modal"
            >
              <IconClose size={18} />
            </button>

            <div className="receipt-header-icon">
              <div className="receipt-badge-icon">
                <IconCheck size={28} />
              </div>
              <h2 className="receipt-title">Transaction Details</h2>
              <span className={`status-pill ${selectedTx.status}`}>
                {selectedTx.status}
              </span>
            </div>

            <div className="receipt-amount-badge lg">
              <span className="r-curr">$</span>
              <span className="r-val">{Number(selectedTx.amount).toFixed(2)}</span>
              <span className="r-code">{(selectedTx.currency || 'usd').toUpperCase()}</span>
            </div>

            <div className="receipt-grid">
              <div className="receipt-item">
                <span className="r-label">Transaction ID</span>
                <div className="r-copy-row">
                  <code className="r-code-val">{selectedTx._id || selectedTx.id}</code>
                  <button
                    type="button"
                    className="btn-copy-id"
                    onClick={() => handleCopy(selectedTx._id || selectedTx.id)}
                  >
                    <IconCopy size={13} />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="receipt-item">
                <span className="r-label">Order ID</span>
                <span className="r-text">{selectedTx.orderId || 'N/A'}</span>
              </div>

              <div className="receipt-item">
                <span className="r-label">Payer Name</span>
                <span className="r-text">{selectedTx.userName || user.name}</span>
              </div>

              <div className="receipt-item">
                <span className="r-label">Payment Date</span>
                <span className="r-text">
                  {new Date(selectedTx.paidAt || selectedTx.createdAt).toLocaleString()}
                </span>
              </div>

              {selectedTx.stripeCheckoutSessionId && (
                <div className="receipt-item span-2">
                  <span className="r-label">Stripe Session Reference</span>
                  <code className="r-code-val">{selectedTx.stripeCheckoutSessionId}</code>
                </div>
              )}
            </div>

            <div className="receipt-actions">
              <button
                type="button"
                className="btn-download-receipt"
                onClick={() => handleDownloadTx(selectedTx)}
              >
                <IconDownload size={16} />
                <span>Download Receipt</span>
              </button>
              <button
                type="button"
                className="btn-done-action"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}