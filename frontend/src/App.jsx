import { useEffect, useState } from 'react'
import RolePicker from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import { fetchDashboard } from './api.js'

export default function App() {
  const [role, setRole] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!role) return
    setData(null)
    setError('')
    fetchDashboard(role)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [role])

  if (!role) return <RolePicker onPick={setRole} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Personal View</div>
        <div className="userbox">
          {data && <span>{data.name}</span>}
          <span className="role-badge">{role}</span>
          <button className="btn-secondary" onClick={() => setRole(null)}>
            Switch view
          </button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {data ? <Dashboard data={data} /> : !error && <p className="loading">Loading…</p>}
    </div>
  )
}
