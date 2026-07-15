import Shell from '../components/Shell.jsx'
import Home from '../pages/Home.jsx'
import Financials from '../pages/Financials.jsx'
import Engagement from '../pages/Engagement.jsx'
import Opportunities from '../pages/Opportunities.jsx'

const PAGES = ['Home', 'My Financials', 'My Engagement', 'My Opportunities']

/** Client Advisor view — the original single-advisor cockpit, unchanged. */
export default function CAView({ onSwitchRole }) {
  return (
    <Shell
      roleLabel="Client Advisor"
      roleBadgeClass="role-ca"
      pages={PAGES}
      initials="JM"
      onSwitchRole={onSwitchRole}
      renderPage={(page, { navigate, openClient }) => (
        <>
          {page === 'Home' && <Home onNavigate={navigate} onOpenClient={openClient} />}
          {page === 'My Financials' && <Financials onOpenClient={openClient} />}
          {page === 'My Engagement' && <Engagement onOpenClient={openClient} />}
          {page === 'My Opportunities' && <Opportunities onOpenClient={openClient} />}
        </>
      )}
    />
  )
}
