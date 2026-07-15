import { useState } from 'react'
import RolePicker from './pages/RolePicker.jsx'
import CAView from './views/CAView.jsx'
import SpecialistView from './views/SpecialistView.jsx'
import ManagementView from './views/ManagementView.jsx'

const STORAGE_KEY = 'insights.role'

const VALID = ['ca', 'specialist', 'management']

export default function App() {
  // Persist the chosen role so a refresh keeps the same view; null → show the picker.
  // A ?role= query param (deep-link) takes precedence and is remembered.
  const [role, setRole] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('role')
    if (q && VALID.includes(q)) {
      localStorage.setItem(STORAGE_KEY, q)
      return q
    }
    return localStorage.getItem(STORAGE_KEY)
  })

  function pickRole(next) {
    localStorage.setItem(STORAGE_KEY, next)
    setRole(next)
  }

  function switchRole() {
    localStorage.removeItem(STORAGE_KEY)
    setRole(null)
  }

  if (!role) return <RolePicker onPick={pickRole} />
  if (role === 'specialist') return <SpecialistView onSwitchRole={switchRole} />
  if (role === 'management') return <ManagementView onSwitchRole={switchRole} />
  return <CAView onSwitchRole={switchRole} />
}
