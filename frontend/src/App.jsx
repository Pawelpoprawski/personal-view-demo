import { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import Financials from './pages/Financials.jsx'
import Engagement from './pages/Engagement.jsx'
import Opportunities from './pages/Opportunities.jsx'
import Client from './pages/Client.jsx'
import SearchBox from './components/SearchBox.jsx'
import Notifications from './components/Notifications.jsx'
import TalkWidget from './components/TalkWidget.jsx'

const PAGES = ['Home', 'My Financials', 'My Engagement', 'My Opportunities']

export default function App() {
  const [page, setPage] = useState('Home')
  // { id, name, from } — set when a client one-pager is open
  const [client, setClient] = useState(null)

  useEffect(() => {
    const title = client ? client.name || 'Client' : page
    document.title = title === 'Home' ? 'Insights Platform' : `${title} · Insights Platform`
  }, [page, client])

  function navigate(p) {
    setClient(null)
    setPage(p)
  }

  function openClient(id, name) {
    setClient({ id, name, from: page })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-mark" />
            <span className="brand-name">Insights Platform</span>
          </div>
          <nav className="mainnav">
            {PAGES.map((p) => (
              <button
                key={p}
                type="button"
                className={`nav-link ${p === page && !client ? 'nav-link-active' : ''}`}
                onClick={() => navigate(p)}
              >
                {p}
              </button>
            ))}
          </nav>
        </div>
        <div className="topbar-center">
          <SearchBox onOpenClient={openClient} onNavigate={navigate} />
        </div>
        <div className="userbox">
          <Notifications onOpenClient={openClient} />
          <span className="avatar">JM</span>
        </div>
      </header>

      {(page !== 'Home' || client) && (
        <div className="breadcrumbs">
          <button type="button" className="crumb" onClick={() => navigate('Home')}>Home</button>
          {client ? (
            <>
              {client.from !== 'Home' && (
                <>
                  <span className="crumb-sep">›</span>
                  <button type="button" className="crumb" onClick={() => setClient(null)}>{client.from}</button>
                </>
              )}
              <span className="crumb-sep">›</span>
              <span className="crumb-current">{client.name || 'Client'}</span>
            </>
          ) : (
            <>
              <span className="crumb-sep">›</span>
              <span className="crumb-current">{page}</span>
            </>
          )}
        </div>
      )}

      {client ? (
        <Client clientId={client.id} />
      ) : (
        <>
          {page === 'Home' && <Home onNavigate={navigate} onOpenClient={openClient} />}
          {page === 'My Financials' && <Financials onOpenClient={openClient} />}
          {page === 'My Engagement' && <Engagement onOpenClient={openClient} />}
          {page === 'My Opportunities' && <Opportunities onOpenClient={openClient} />}
        </>
      )}

      <TalkWidget context={client?.name || ''} />
    </div>
  )
}
