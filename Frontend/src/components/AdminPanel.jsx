import { useState, useEffect } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'
import { IconSearch, IconRefresh, IconDownload, IconShield } from './icons'
import './AdminPanel.css'

export default function AdminPanel({ user }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

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
      setError('Server unreachable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.email])

  if (!isAdmin) {
    return (
      <div className="simple-page-container">
        <div className="simple-card admin-denied-box">
          <IconShield size={36} className="denied-icon" />
          <h2>Access Restricted</h2>
          <p>
            You must be logged in as an administrator (<strong>{ADMIN_EMAIL}</strong>) to access this page.
          </p>
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    if (payments.length === 0) return

    const headers = ['Transaction ID', 'Customer', 'User ID', 'Amount', 'Currency', 'Status', 'Order ID', 'Date']
    const rows = payments.map((p) => [
      p._id || p.id,
      `"${(p.userName || '').replace(/"/g, '""')}"`,
      p.userId || '',
      Number(p.amount || 0).toFixed(2),
      (p.currency || 'USD').toUpperCase(),
      p.status || 'paid',
      `"${(p.orderId || '').replace(/"/g, '""')}"`,
      `"${new Date(p.paidAt || p.createdAt).toISOString()}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Calculate totals by currency (USD & INR)
  const paidPayments = payments.filter((p) => p.status === 'paid' || p.status === 'completed')
  const totalUsd = paidPayments
    .filter((p) => (p.currency || 'usd').toLowerCase() === 'usd')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const totalInr = paidPayments
    .filter((p) => (p.currency || '').toLowerCase() === 'inr')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  // Filter & Search
  const filtered = payments.filter((p) => {
    const matchesStatus = filterStatus === 'all' || (p.status || '').toLowerCase() === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      (p.userName || '').toLowerCase().includes(q) ||
      String(p.userId || '').toLowerCase().includes(q) ||
      String(p._id || p.id || '').toLowerCase().includes(q) ||
      (p.orderId || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="simple-page-container">
      {/* Header */}
      <div className="simple-header-row">
        <div>
          <h1 className="simple-page-title">Admin Dashboard</h1>
          <p className="simple-page-sub">All platform transactions</p>
        </div>

        <div className="admin-btn-group">
          <button
            type="button"
            className="btn-simple-refresh"
            onClick={handleExportCSV}
            disabled={payments.length === 0}
            title="Download CSV"
          >
            <IconDownload size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-simple-refresh"
            onClick={fetchPayments}
            disabled={loading}
          >
            <IconRefresh size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="simple-alert error">
          <span>{error}</span>
        </div>
      )}

      {/* Simple Stats Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Transactions</span>
          <span className="admin-stat-value">{payments.length}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">USD Volume</span>
          <span className="admin-stat-value">${totalUsd.toFixed(2)}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Rupees Volume</span>
          <span className="admin-stat-value">₹{totalInr.toFixed(2)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="table-controls-bar">
        <div className="simple-search-box">
          <IconSearch size={15} className="search-ico" />
          <input
            type="text"
            placeholder="Search by customer, order ID, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="simple-search-input"
          />
        </div>

        <div className="filter-pill-group">
          {['all', 'paid', 'pending', 'failed'].map((st) => (
            <button
              key={st}
              type="button"
              className={`status-filter-btn ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="simple-table-card">
        {loading && payments.length === 0 ? (
          <div className="simple-empty-box">
            <IconRefresh size={24} className="spin" />
            <p>Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="simple-empty-box">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="simple-data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isRupee = (p.currency || '').toLowerCase() === 'inr'
                  const sym = isRupee ? '₹' : '$'
                  const statusClass = (p.status || 'paid').toLowerCase()

                  return (
                    <tr key={p._id || p.id}>
                      <td>
                        <div className="admin-customer-info">
                          <span className="customer-name-bold">{p.userName || 'Customer'}</span>
                          <span className="customer-id-sub">ID: {p.userId}</span>
                        </div>
                      </td>
                      <td className="cell-mono">{p.orderId || p._id || p.id}</td>
                      <td className="cell-amount-simple">
                        {sym}{Number(p.amount).toFixed(2)}
                      </td>
                      <td className="cell-curr">
                        {(p.currency || 'USD').toUpperCase()}
                      </td>
                      <td>
                        <span className={`status-badge-simple ${statusClass}`}>
                          {p.status || 'paid'}
                        </span>
                      </td>
                      <td className="cell-date-simple">
                        {new Date(p.createdAt || p.paidAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
