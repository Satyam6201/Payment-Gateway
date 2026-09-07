import { useState, useEffect } from 'react'
import { API_URL } from '../api'

export default function MyPaymentsPage({ user }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/order/payments?userId=${user.id}`)
      const data = await res.json()
      if (data.success) setPayments(data.payments || [])
      else setError(data.message || 'Failed to load payments')
    } catch {
      setError('Cannot connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user.id])

  return (
    <div className="card card-wide">
      <div className="card-header-flex">
        <h2>My Payments</h2>
        <button type="button" className="btn-sm" onClick={fetchPayments}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <div className="alert error">{error}</div>
      ) : payments.length === 0 ? (
        <p className="empty">No payments found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
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