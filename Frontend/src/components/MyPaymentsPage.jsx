import { useState, useEffect } from 'react'
import { API_URL } from '../api'
import { IconSearch, IconRefresh, IconDownload } from './icons'
import './MyPaymentsPage.css'

export default function MyPaymentsPage({ user, onNavigateToPay }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/order/payments?userId=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setPayments(data.payments || [])
      } else {
        setError(data.message || 'Failed to load payments.')
      }
    } catch {
      setError('Server unreachable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.id])

  const handleDownloadReceipt = (tx) => {
    const isRupee = (tx.currency || '').toLowerCase() === 'inr'
    const sym = isRupee ? '₹' : '$'

    const text = `PAYMENT RECEIPT
--------------------------------------
Transaction ID : ${tx._id || tx.id}
Order ID       : ${tx.orderId || 'N/A'}
Date           : ${new Date(tx.paidAt || tx.createdAt).toLocaleString()}
Customer       : ${tx.userName || user.name}
Amount         : ${sym}${Number(tx.amount).toFixed(2)} ${(tx.currency || 'USD').toUpperCase()}
Status         : ${(tx.status || 'paid').toUpperCase()}
--------------------------------------`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt_${tx.orderId || tx.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter and search
  const filtered = payments.filter((p) => {
    const matchesStatus = filterStatus === 'all' || (p.status || '').toLowerCase() === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      (p.orderId || '').toLowerCase().includes(q) ||
      (String(p._id || p.id) || '').toLowerCase().includes(q) ||
      (String(p.amount) || '').includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="simple-page-container">
      {/* Header */}
      <div className="simple-header-row">
        <div>
          <h1 className="simple-page-title">My Payments</h1>
          <p className="simple-page-sub">History of your payments and transactions</p>
        </div>

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

      {error && (
        <div className="simple-alert error">
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="table-controls-bar">
        <div className="simple-search-box">
          <IconSearch size={15} className="search-ico" />
          <input
            type="text"
            placeholder="Search payments..."
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
            <p>No payments found.</p>
            {payments.length === 0 && (
              <button type="button" className="btn-primary" onClick={onNavigateToPay}>
                Make First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="simple-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isRupee = (p.currency || '').toLowerCase() === 'inr'
                  const sym = isRupee ? '₹' : '$'
                  const statusClass = (p.status || 'paid').toLowerCase()

                  return (
                    <tr key={p._id || p.id}>
                      <td className="cell-date-simple">
                        {new Date(p.createdAt || p.paidAt || Date.now()).toLocaleDateString()}
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
                      <td>
                        <button
                          type="button"
                          className="btn-download-sm"
                          onClick={() => handleDownloadReceipt(p)}
                          title="Download Receipt"
                        >
                          <IconDownload size={14} />
                          <span>Receipt</span>
                        </button>
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