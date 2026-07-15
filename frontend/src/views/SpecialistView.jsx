import { useEffect, useMemo, useState } from 'react'
import Shell from '../components/Shell.jsx'
import ScoreDots from '../components/ScoreDots.jsx'
import { fetchOpportunities, fetchEngagement, updateOpportunity } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'

// Module-level so useFetch keeps a stable fetcher identity (no refetch loop).
const loadSpecialist = () =>
  Promise.all([fetchOpportunities(), fetchEngagement()]).then(([opps, eng]) => ({ opps, eng }))

const money = (m) => `$${Number(m).toFixed(1)}M`
const isOpen = (o) => o.status !== 'Closed'

function statusClass(status) {
  return `status-tag status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

/** Specialist persona selector — reused at the top of every specialist page. */
function SpecHeader({ title, sub, team, selId, setSelId, right }) {
  const me = team.find((t) => t.id === selId)
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="welcome-sub" style={{ margin: 0 }}>{sub}</p>}
      </div>
      <div className="panel-head-right">
        {right}
        <label className="spec-picker">
          <span>Viewing as</span>
          <select className="cell-input" value={selId} onChange={(e) => setSelId(Number(e.target.value))}>
            {team.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.role}</option>)}
          </select>
        </label>
        {me && <span className="avatar" title={me.role}>{me.initials}</span>}
      </div>
    </div>
  )
}

function ProductPipeline({ opps }) {
  const byProduct = useMemo(() => {
    const map = new Map()
    opps.filter(isOpen).forEach((o) => {
      const cur = map.get(o.product) || { product: o.product, count: 0, value: 0 }
      cur.count += 1
      cur.value += o.estimated_value_musd
      map.set(o.product, cur)
    })
    return [...map.values()].sort((a, b) => b.value - a.value)
  }, [opps])
  const max = Math.max(1, ...byProduct.map((p) => p.value))

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Pipeline by Product</h2>
        <span className="panel-meta">open deals across the desk</span>
      </div>
      {byProduct.map((p) => (
        <div key={p.product} className="bar-row">
          <span className="bar-label">{p.product}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(p.value / max) * 100}%` }} />
          </span>
          <span className="bar-value">{money(p.value)} · {p.count}</span>
        </div>
      ))}
    </section>
  )
}

function SpecOverview({ state, selId, setSelId, navigate, openClient }) {
  const { opps } = state
  const team = opps.team
  const mine = opps.opportunities.filter((o) => o.assignees.some((a) => a.id === selId))
  const mineOpen = mine.filter(isOpen)
  const pipeline = mineOpen.reduce((s, o) => s + o.estimated_value_musd, 0)
  const inReview = mineOpen.filter((o) => o.status === 'In Review').length
  const avgPot = mineOpen.length
    ? (mineOpen.reduce((s, o) => s + o.potential_score, 0) / mineOpen.length).toFixed(1)
    : '—'

  return (
    <main className="content">
      <SpecHeader title="Specialist Overview" sub="Product coverage across the desk" team={team} selId={selId} setSelId={setSelId} />

      <div className="tile-row">
        <button type="button" className="data-tile clickable" onClick={() => navigate('My Deals')}>
          <div className="tile-value">{money(pipeline)}</div>
          <div className="tile-label">My Open Pipeline</div>
          <div className="tile-sub">{mineOpen.length} live deals</div>
        </button>
        <div className="data-tile">
          <div className="tile-value">{inReview}</div>
          <div className="tile-label">In Review</div>
          <div className="tile-sub">awaiting decision</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{avgPot}</div>
          <div className="tile-label">Avg. Potential</div>
          <div className="tile-sub">my open deals, out of 10</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{opps.kpis.open}</div>
          <div className="tile-label">Desk Open Opportunities</div>
          <div className="tile-sub">{money(opps.kpis.pipeline_musd)} total pipeline</div>
        </div>
      </div>

      <div className="home-grid">
        <ProductPipeline opps={opps.opportunities} />

        <section className="panel">
          <div className="panel-head">
            <h2>My Live Deals</h2>
            <button type="button" className="btn-outline" onClick={() => navigate('My Deals')}>Manage</button>
          </div>
          {mineOpen.length === 0 && <p className="welcome-sub">No open deals for this specialist.</p>}
          {mineOpen.map((o) => (
            <article key={o.id} className="action-card">
              <div className="action-main">
                <div className="action-title-row">
                  <span className="action-title">{o.title}</span>
                  <span className={statusClass(o.status)}>{o.status}</span>
                </div>
                <p className="action-detail">
                  <button type="button" className="client-link" onClick={() => openClient(o.client_id, o.client_name)}>
                    {o.client_name}
                  </button>
                  {' '}· {o.product} · {money(o.estimated_value_musd)}
                </p>
                <div className="action-meta"><ScoreDots value={o.potential_score} /></div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

function SpecDeals({ state, setState, selId, setSelId, openClient }) {
  const { opps } = state
  const team = opps.team
  const mine = opps.opportunities.filter((o) => o.assignees.some((a) => a.id === selId))
  const [busy, setBusy] = useState(null)

  async function changeStatus(o, status) {
    setBusy(o.id)
    try {
      const updated = await updateOpportunity(o.id, { status })
      setState((s) => ({
        ...s,
        opps: {
          ...s.opps,
          opportunities: s.opps.opportunities.map((x) => (x.id === o.id ? { ...x, ...updated } : x)),
        },
      }))
    } catch {
      window.alert('Could not update the deal. Try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="content">
      <SpecHeader title="My Deals" sub="Deals you are assigned to, across all advisors" team={team} selId={selId} setSelId={setSelId} />

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Product</th><th>Deal</th>
              <th className="num">Value</th><th>Potential</th><th>Status</th><th className="num">Updated</th>
            </tr>
          </thead>
          <tbody>
            {mine.length === 0 && (
              <tr><td colSpan={7} className="search-empty">No deals for this specialist.</td></tr>
            )}
            {mine.map((o) => (
              <tr key={o.id}>
                <td>
                  <button type="button" className="client-link" onClick={() => openClient(o.client_id, o.client_name)}>
                    {o.client_name}
                  </button>
                </td>
                <td>{o.product}</td>
                <td>{o.title}</td>
                <td className="num">{money(o.estimated_value_musd)}</td>
                <td><ScoreDots value={o.potential_score} /></td>
                <td>
                  <select
                    className="cell-input"
                    value={o.status}
                    disabled={busy === o.id}
                    onChange={(e) => changeStatus(o, e.target.value)}
                  >
                    {opps.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="num">{o.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function SpecCoverage({ state, setState, selId, setSelId, openClient }) {
  const { opps, eng } = state
  const team = opps.team
  const me = team.find((t) => t.id === selId)

  // Leads: open deals across the desk this specialist is NOT on yet — grab them.
  const leads = opps.opportunities.filter((o) => isOpen(o) && !o.assignees.some((a) => a.id === selId))

  // Coverage gap: clients with no specialist interaction on record this year.
  const coveredIds = new Set(eng.interactions.filter((i) => i.with_specialist).map((i) => i.client_id))
  const uncovered = eng.clients.filter((c) => !coveredIds.has(c.id))
  const [busy, setBusy] = useState(null)

  async function joinDeal(o) {
    setBusy(o.id)
    try {
      const ids = [...o.assignees.map((a) => a.id), selId]
      const updated = await updateOpportunity(o.id, { assignees: ids })
      setState((s) => ({
        ...s,
        opps: {
          ...s.opps,
          opportunities: s.opps.opportunities.map((x) => (x.id === o.id ? { ...x, ...updated } : x)),
        },
      }))
    } catch {
      window.alert('Could not join the deal. Try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="content">
      <SpecHeader title="Coverage & Leads" sub="Where a specialist can add value next" team={team} selId={selId} setSelId={setSelId} />

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Open Leads to Grab</h2>
            <span className="panel-meta">deals {me?.initials} is not on yet</span>
          </div>
          {leads.length === 0 && <p className="welcome-sub">You are already on every open deal.</p>}
          {leads.map((o) => (
            <article key={o.id} className="action-card">
              <div className="action-main">
                <div className="action-title-row">
                  <span className="priority-dot priority-high" />
                  <span className="action-title">{o.title}</span>
                  <span className={statusClass(o.status)}>{o.status}</span>
                </div>
                <p className="action-detail">
                  <button type="button" className="client-link" onClick={() => openClient(o.client_id, o.client_name)}>
                    {o.client_name}
                  </button>
                  {' '}· {o.product} · {money(o.estimated_value_musd)} · potential {o.potential_score}/10
                </p>
              </div>
              <button type="button" className="btn-outline" disabled={busy === o.id} onClick={() => joinDeal(o)}>
                {busy === o.id ? 'Joining…' : 'Join deal'}
              </button>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Clients Without Specialist Contact</h2>
            <span className="panel-meta">outreach candidates</span>
          </div>
          {uncovered.length === 0 && <p className="welcome-sub">Every client has met a specialist.</p>}
          {uncovered.map((c) => (
            <article key={c.id} className="meeting-item">
              <div className="meeting-main">
                <div className="news-headline">
                  <button type="button" className="client-link" onClick={() => openClient(c.id, c.name)}>{c.name}</button>
                </div>
                <div className="news-meta">
                  Engagement {c.engagement_score}/10 · last contact {c.last_interaction_days} days ago
                </div>
              </div>
              {c.needs_attention && <span className="flag">Needs attention</span>}
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

const PAGES = ['Overview', 'My Deals', 'Coverage']

export default function SpecialistView({ onSwitchRole }) {
  const { data: fetched, error, reload } = useFetch(loadSpecialist)
  const [state, setState] = useState(null)
  const [selId, setSelId] = useState(1) // default: first specialist

  useEffect(() => { setState(fetched) }, [fetched])

  return (
    <Shell
      roleLabel="Specialist"
      roleBadgeClass="role-spec"
      pages={PAGES}
      initials="SK"
      onSwitchRole={onSwitchRole}
      renderPage={(page, { navigate, openClient }) => {
        if (!state) return <main className="content"><PageStatus error={error} reload={reload} /></main>
        const ctx = { state, setState, selId, setSelId, navigate, openClient }
        if (page === 'My Deals') return <SpecDeals {...ctx} />
        if (page === 'Coverage') return <SpecCoverage {...ctx} />
        return <SpecOverview {...ctx} />
      }}
    />
  )
}
