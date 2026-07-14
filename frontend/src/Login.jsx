import { useState } from 'react'
import { loginRole } from './api.js'

const ROLES = [
  { role: 'Client Advisor', desc: 'Moi klienci, revenues, invested assets' },
  { role: 'Specialist', desc: 'Propozycje produktowe (Sales), pipeline' },
  { role: 'Management', desc: 'Sumaryczne dane zespołu i segmentów' },
]

export default function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function pick(role) {
    setBusy(role)
    setError('')
    try {
      onLogin(await loginRole(role))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card role-card">
        <h1>Personal View</h1>
        <p className="subtitle">Wybierz swój profil</p>
        {ROLES.map((r) => (
          <button
            key={r.role}
            className="role-btn"
            disabled={!!busy}
            onClick={() => pick(r.role)}
          >
            <span className="role-btn-title">{busy === r.role ? 'Logowanie…' : r.role}</span>
            <span className="role-btn-desc">{r.desc}</span>
          </button>
        ))}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
