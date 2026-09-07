import { useState, useEffect } from 'react'
import { API_URL, ADMIN_EMAIL } from '../api'

export default function AdminPanel({ user }) {
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchPayments = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/order/all?adminEmail=${encodeURIComponent(user.email)}`, {
        headers: { 'x-admin-email': user.email },
      })
      const data = await res.json()
      if (data.success) setPayments(data.payments || [])
      else setError(data.message || 'Access denied.')
    } catch {
      setError('Unable to fetch transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.email])

  if (!isAdmin) {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p>Only {ADMIN_EMAIL} can view all transactions.</p>
      </div>
    )
  }

  const totalRev = payments
    .filter((p) => p.status === 'paid' || p.status === 'completed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.userName || '').toLowerCase().includes(q) ||
      (p.userId || '').toLowerCase().includes(q) ||
      (p._id || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="card card-wide">
      <div className="card-header-flex">
        <div>
          <h2>Admin Transactions</h2>
          <p className="subtitle">All platform payments (Logged in as {user.email})</p>
        </div>
        <button type="button" className="btn-sm" onClick={fetchPayments}>
          Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-title">Total Revenue</span>
          <span className="stat-num">${totalRev.toLocaleString()}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">Total Transactions</span>
          <span className="stat-num">{payments.length}</span>
        </div>
      </div>

      <input
        type="text"
        className="search-bar"
        placeholder="Filter by name, user ID, or payment ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <div className="alert error">{error}</div>
      ) : filtered.length === 0 ? (
        <p className="empty">No transactions found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>User ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                <td><strong>{p.userName}</strong></td>
                <td><code>{p.userId}</code></td>
                <td><strong>${p.amount}</strong></td>
                <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                <td><code>{p._id}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
