/** Landing screen — choose which view to enter. Stored so refresh keeps it. */

const ROLES = [
  {
    key: 'ca',
    label: 'CA View',
    who: 'Client Advisor',
    tagline: 'Your book, your day',
    desc: 'Personal cockpit for a Client Advisor — actions, meetings, client news, financials, engagement and your opportunity pipeline.',
    points: ['My actions & prep packs', 'Client one-pagers', 'My financials & engagement'],
    initials: 'JM',
  },
  {
    key: 'specialist',
    label: 'Specialist View',
    who: 'Product Specialist · Sales',
    tagline: 'Deals & product coverage',
    desc: 'Sales-focused workspace for a product specialist — the deals you are on, pipeline by product, and clients that still need specialist coverage.',
    points: ['My deals across advisors', 'Pipeline by product', 'Coverage & leads to grab'],
    initials: 'SK',
  },
  {
    key: 'management',
    label: 'Management View',
    who: 'Desk Head · Management',
    tagline: 'The whole desk at a glance',
    desc: 'Aggregated desk dashboard — book AUM, net new money and revenue trends, team performance and book-health risk flags.',
    points: ['Desk KPIs & trends', 'Team performance', 'Book-health & risk'],
    initials: 'DC',
  },
]

export default function RolePicker({ onPick }) {
  return (
    <div className="rolepick">
      <header className="rolepick-top">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Insights Platform</span>
        </div>
      </header>

      <main className="rolepick-main">
        <h1 className="rolepick-title">Choose your view</h1>
        <p className="rolepick-sub">The same platform, tailored to how you work. You can switch any time.</p>

        <div className="rolepick-grid">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`rolecard rolecard-${r.key}`}
              onClick={() => onPick(r.key)}
            >
              <div className="rolecard-head">
                <span className="rolecard-avatar">{r.initials}</span>
                <span className="rolecard-badge">{r.who}</span>
              </div>
              <h2 className="rolecard-name">{r.label}</h2>
              <p className="rolecard-tagline">{r.tagline}</p>
              <p className="rolecard-desc">{r.desc}</p>
              <ul className="rolecard-points">
                {r.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <span className="rolecard-cta">Enter {r.label} →</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
