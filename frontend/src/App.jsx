import { useEffect, useState } from 'react'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import { fetchDashboard, logout } from './api.js'

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem('session')
    return saved ? JSON.parse(saved) : null
  })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    fetchDashboard(session.token)
      .then(setData)
      .catch(() => handleLogout())
  }, [session])

  function handleLogin(s) {
    sessionStorage.setItem('session', JSON.stringify(s))
    setSession(s)
    setError('')
  }

  function handleLogout() {
    if (session) logout(session.token)
    sessionStorage.removeItem('session')
    setSession(null)
    setData(null)
  }

  if (!session) return <Login onLogin={handleLogin} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Personal View</div>
        <div className="userbox">
          <span>{session.name}</span>
          <span className="role-badge">{session.role}</span>
          <button className="btn-secondary" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {data ? <Dashboard data={data} token={session.token} /> : <p className="loading">Loading…</p>}
    </div>
  )
}
