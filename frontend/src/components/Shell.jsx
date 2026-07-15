import { useEffect, useState } from 'react'
import Notifications from './Notifications.jsx'
import TalkWidget from './TalkWidget.jsx'
import Client from '../pages/Client.jsx'

/**
 * Shared app chrome used by every role view: topbar, role badge, primary nav,
 * breadcrumbs, global search, notifications, the client one-pager overlay and
 * the Talk widget. Each view supplies its own `pages` and a `renderPage`.
 */
export default function Shell({
  roleLabel, roleBadgeClass, pages, initials = 'JM', onSwitchRole, renderPage,
}) {
  const home = pages[0]
  const [page, setPage] = useState(home)
  // { id, name, from } — set when a client one-pager is open
  const [client, setClient] = useState(null)

  useEffect(() => {
    const title = client ? client.name || 'Client' : page
    document.title = title === home ? 'Insights Platform' : `${title} · Insights Platform`
  }, [page, client, home])

  function navigate(p) {
    if (!pages.includes(p)) return // ignore cross-view targets (e.g. search shortcuts)
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
            <span className="brand-block">
              <span className="brand-tag"><b>Portal</b></span>
            </span>
            <span className="brand-name">Insights Platform</span>
            <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
          </div>
          <nav className="mainnav">
            {pages.map((p) => (
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
        <div className="userbox">
          <button type="button" className="role-switch" onClick={onSwitchRole} title="Switch view">
            Switch view
          </button>
          <Notifications onOpenClient={openClient} />
          <button
            type="button"
            className="talk-cta"
            onClick={() => window.dispatchEvent(new Event('insights:open-talk'))}
          >
            Talk to UGiP
          </button>
        </div>
      </header>

      {(page !== home || client) && (
        <div className="breadcrumbs">
          <button type="button" className="crumb" onClick={() => navigate(home)}>{home}</button>
          {client ? (
            <>
              {client.from !== home && (
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

      {client ? <Client clientId={client.id} /> : renderPage(page, { navigate, openClient })}

      <TalkWidget context={client?.name || ''} />
    </div>
  )
}
