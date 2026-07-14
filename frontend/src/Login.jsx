const ROLES = [
  { role: 'Client Advisor', desc: 'My clients, revenues, invested assets' },
  { role: 'Specialist', desc: 'Product proposals (Sales), pipeline' },
  { role: 'Management', desc: 'Team-level summary figures' },
]

export default function RolePicker({ onPick }) {
  return (
    <div className="login-wrap">
      <div className="login-card role-card">
        <h1>Personal View</h1>
        <p className="subtitle">Choose your view</p>
        {ROLES.map((r) => (
          <button key={r.role} className="role-btn" onClick={() => onPick(r.role)}>
            <span className="role-btn-title">{r.role}</span>
            <span className="role-btn-desc">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
