import { useState, useEffect } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'
import {
  IconShield,
  IconTrendingUp,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconCopy,
  IconCheck,
  IconClose
} from './icons'
import './AdminPanel.css'

export default function AdminPanel({ user }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchPayments = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/order/all?adminEmail=${encodeURIComponent(user.email)}`, {
        headers: { 'x-admin-email': user.email },
      })
      const data = await res.json()
      if (data.success) {
        setPayments(data.payments || [])
      } else {
        setError(data.message || 'Access denied.')
      }
    } catch {
      setError('Unable to fetch transactions from server. Please verify backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.email])

  if (!isAdmin) {
    return (
      <div className="card-elevated access-denied-card">
        <div className="access-denied-icon">
          <IconShield size={36} />
        </div>
        <h2>Restricted Administrator Hub</h2>
        <p>
          This dashboard requires administrative credentials. Logged in as <strong>{user?.email}</strong>.
          Only <strong>{ADMIN_EMAIL}</strong> has permission to view platform-wide transactions.
        </p>
      </div>
    )
  }

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCSV = () => {
    if (payments.length === 0) return

    const headers = ['ID', 'User Name', 'User ID', 'Amount', 'Currency', 'Status', 'Order ID', 'Stripe Session ID', 'Date']
    const rows = payments.map((p) => [
      p._id || p.id,
      `"${(p.userName || '').replace(/"/g, '""')}"`,
      p.userId || '',
      Number(p.amount || 0).toFixed(2),
      (p.currency || 'usd').toUpperCase(),
      p.status || 'paid',
      `"${(p.orderId || '').replace(/"/g, '""')}"`,
      p.stripeCheckoutSessionId || '',
      `"${new Date(p.paidAt || p.createdAt).toISOString()}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Platform_Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Analytics Metrics
  const paidPayments = payments.filter((p) => p.status === 'paid' || p.status === 'completed')
  const totalRev = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const avgOrderValue = paidPayments.length > 0 ? totalRev / paidPayments.length : 0

  // Filter & Search
  const filtered = payments.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status?.toLowerCase() === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      (p.userName || '').toLowerCase().includes(q) ||
      String(p.userId || '').toLowerCase().includes(q) ||
      String(p._id || p.id || '').toLowerCase().includes(q) ||
      (p.orderId || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="admin-view-container">
      {/* Executive Welcome Bar */}
      <div className="admin-hero">
        <div>
          <div className="admin-status-badge">
            <span className="live-pulse"></span>
            <span>MySQL Production Ledger Active</span>
          </div>
          <h1 className="admin-title">Platform Intelligence & Admin Hub</h1>
          <p className="admin-subtitle">
            Welcome back, {user.name} ({user.email}). Monitoring all transactions in real time.
          </p>
        </div>

        <div className="admin-actions-flex">
          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCSV}
            disabled={payments.length === 0}
            title="Download full ledger as CSV"
          >
            <IconDownload size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-action-refresh"
            onClick={fetchPayments}
            disabled={loading}
          >
            <IconRefresh size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card gold">
          <div className="kpi-icon-wrap">
            <IconTrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Gross Revenue Collected</span>
            <h2 className="kpi-number">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span className="kpi-badge positive">100% Settled & Verified</span>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon-wrap">
            <IconShield size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total System Transactions</span>
            <h2 className="kpi-number">{payments.length}</h2>
            <span className="kpi-badge neutral">{paidPayments.length} Succeeded</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon-wrap">
            <IconCheck size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Average Order Value (AOV)</span>
            <h2 className="kpi-number">${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span className="kpi-badge positive">Healthy Platform Average</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="card-elevated admin-table-card">
        <div className="admin-table-header">
          <div>
            <h2 className="section-title">Global Transaction Log</h2>
            <p className="section-subtitle">
              Showing {filtered.length} of {payments.length} total payments
            </p>
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

        {/* Search Bar */}
        <div className="search-input-wrap">
          <IconSearch size={16} className="search-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Filter by customer name, user ID, payment ID, or order reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="btn-clear-search" onClick={() => setSearch('')}>
              <IconClose size={14} />
            </button>
          )}
        </div>

        {/* State Renders */}
        {loading ? (
          <div className="table-loading-state">
            <span className="mini-spinner"></span>
            <p>Syncing transactions with MySQL...</p>
          </div>
        ) : error ? (
          <div className="status-banner error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-human">
            <h3>No Transactions Match</h3>
            <p>Try clearing your search term or selecting a different status filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Customer</th>
                  <th>User ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Record ID</th>
                  <th className="text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id || p.id} className="table-row-hover" onClick={() => setSelectedPayment(p)}>
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
                    <td>
                      <div className="user-name-cell">
                        <span className="customer-avatar-sm">{(p.userName || 'C').charAt(0)}</span>
                        <strong className="customer-name">{p.userName}</strong>
                      </div>
                    </td>
                    <td>
                      <code className="id-code-chip muted">{p.userId}</code>
                    </td>
                    <td className="cell-amount">
                      <span className="amount-badge primary">
                        ${Number(p.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${p.status}`}>
                        {p.status === 'paid' && <IconCheck size={12} />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td>
                      <code className="id-code-chip">{p._id || p.id}</code>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-view-receipt-sm"
                        onClick={() => setSelectedPayment(p)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Payment Inspect Modal */}
      {selectedPayment && (
        <div className="modal-backdrop" onClick={() => setSelectedPayment(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-modal-close"
              onClick={() => setSelectedPayment(null)}
              title="Close inspector"
            >
              <IconClose size={18} />
            </button>

            <div className="receipt-header-icon">
              <div className="receipt-badge-icon admin">
                <IconShield size={28} />
              </div>
              <h2 className="receipt-title">Transaction Inspector</h2>
              <span className={`status-pill ${selectedPayment.status}`}>
                {selectedPayment.status}
              </span>
            </div>

            <div className="receipt-amount-badge lg">
              <span className="r-curr">$</span>
              <span className="r-val">{Number(selectedPayment.amount).toFixed(2)}</span>
              <span className="r-code">{(selectedPayment.currency || 'usd').toUpperCase()}</span>
            </div>

            <div className="receipt-grid">
              <div className="receipt-item">
                <span className="r-label">Database Primary Key ID</span>
                <div className="r-copy-row">
                  <code className="r-code-val">{selectedPayment._id || selectedPayment.id}</code>
                  <button
                    type="button"
                    className="btn-copy-id"
                    onClick={() => handleCopy(selectedPayment._id || selectedPayment.id)}
                  >
                    <IconCopy size={13} />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="receipt-item">
                <span className="r-label">Payer Account</span>
                <span className="r-text">{selectedPayment.userName} (User #{selectedPayment.userId})</span>
              </div>

              <div className="receipt-item">
                <span className="r-label">Order Reference ID</span>
                <span className="r-text">{selectedPayment.orderId || 'Direct'}</span>
              </div>

              <div className="receipt-item">
                <span className="r-label">Recorded At</span>
                <span className="r-text">
                  {new Date(selectedPayment.paidAt || selectedPayment.createdAt).toLocaleString()}
                </span>
              </div>

              {selectedPayment.stripeCheckoutSessionId && (
                <div className="receipt-item span-2">
                  <span className="r-label">Stripe Checkout Session</span>
                  <code className="r-code-val">{selectedPayment.stripeCheckoutSessionId}</code>
                </div>
              )}

              {selectedPayment.failureMessage && (
                <div className="receipt-item span-2">
                  <span className="r-label text-danger">Error / Failure Reason</span>
                  <p className="r-text text-danger">{selectedPayment.failureMessage}</p>
                </div>
              )}
            </div>

            <div className="receipt-actions">
              <button
                type="button"
                className="btn-done-action full"
                onClick={() => setSelectedPayment(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
