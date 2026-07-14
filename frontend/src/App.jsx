import { useState } from 'react'
import Home from './pages/Home.jsx'
import Financials from './pages/Financials.jsx'
import Engagement from './pages/Engagement.jsx'
import Opportunities from './pages/Opportunities.jsx'

const PAGES = ['Home', 'My Financials', 'My Engagement', 'My Opportunities']

export default function App() {
  const [page, setPage] = useState('Home')

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Insights Platform</span>
        </div>
        <nav className="mainnav">
          {PAGES.map((p) => (
            <button
              key={p}
              className={`nav-link ${p === page ? 'nav-link-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </nav>
        <div className="userbox">
          <span className="avatar">JM</span>
        </div>
      </header>

      {page !== 'Home' && (
        <div className="breadcrumbs">
          <button className="crumb" onClick={() => setPage('Home')}>Home</button>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">{page}</span>
        </div>
      )}

      {page === 'Home' && <Home onNavigate={setPage} />}
      {page === 'My Financials' && <Financials />}
      {page === 'My Engagement' && <Engagement />}
      {page === 'My Opportunities' && <Opportunities />}
    </div>
  )
}
