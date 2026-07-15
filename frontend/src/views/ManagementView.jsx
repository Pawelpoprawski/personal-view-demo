import { useEffect, useMemo, useState } from 'react'
import Shell from '../components/Shell.jsx'
import Sparkline from '../components/Sparkline.jsx'
import Donut from '../components/Donut.jsx'
import { fetchFinancials, fetchOpportunities, fetchEngagement } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'

const loadManagement = () =>
  Promise.all([fetchFinancials(), fetchOpportunities(), fetchEngagement()])
    .then(([fin, opps, eng]) => ({ fin, opps, eng }))

const money = (m) => `$${Number(m).toFixed(1)}M`
const isOpen = (o) => o.status !== 'Closed'

function ManageOverview({ state, openClient }) {
  const { fin, opps, eng } = state
  const months = fin.history.map((h) => h.month)
  const tileByKey = Object.fromEntries(fin.tiles.map((t) => [t.key, t]))
  const kpis = [
    { label: 'Book AUM', value: money(tileByKey.aum.value_musd), delta: tileByKey.aum },
    { label: 'Net New Money', value: money(tileByKey.nnm.value_musd), delta: tileByKey.nnm },
    { label: 'Revenue YTD', value: money(tileByKey.revenue.value_musd), delta: tileByKey.revenue },
    { label: 'Open Pipeline', value: money(opps.kpis.pipeline_musd), sub: `${opps.kpis.open} open opportunities` },
    { label: 'Clients', value: String(fin.clients.length), sub: `avg. engagement ${eng.tiles[0].value}` },
  ]

  const pipelineByStatus = useMemo(() => {
    const map = new Map(opps.statuses.map((s) => [s, { status: s, count: 0, value: 0 }]))
    opps.opportunities.forEach((o) => {
      const cur = map.get(o.status)
      if (cur) { cur.count += 1; cur.value += o.estimated_value_musd }
    })
    return [...map.values()]
  }, [opps])
  const maxStatus = Math.max(1, ...pipelineByStatus.map((s) => s.value))

  return (
    <main className="content">
      <h1 className="page-title">Desk Overview</h1>
      <p className="welcome-sub">Wealth Management, Zurich — aggregated across the book</p>

      <div className="tile-row">
        {kpis.map((k) => (
          <div key={k.label} className="data-tile">
            <div className="tile-value">{k.value}</div>
            <div className="tile-label">{k.label}</div>
            {k.delta && (
              <div className={`tile-delta ${k.delta.direction === 'up' ? 'delta-up' : 'delta-down'}`}>
                {k.delta.direction === 'up' ? '▲' : '▼'} {k.delta.delta_musd > 0 ? '+' : ''}{money(k.delta.delta_musd)} vs. last quarter
              </div>
            )}
            {k.sub && <div className="tile-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Book AUM — last 12 months</h2></div>
          <Sparkline points={fin.history.map((h) => h.aum_musd)} labels={months}
                     width={460} height={120} formatValue={(v) => `$${v}M`} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Net New Money — monthly</h2></div>
          <Sparkline type="bar" points={fin.history.map((h) => h.nnm_musd)} labels={months}
                     width={460} height={120} formatValue={(v) => `$${v}M`} />
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Asset Allocation</h2></div>
          <Donut allocation={fin.allocation} />
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Pipeline by Stage</h2>
            <span className="panel-meta">{opps.opportunities.length} opportunities</span>
          </div>
          {pipelineByStatus.map((s) => (
            <div key={s.status} className="bar-row">
              <span className="bar-label">{s.status}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${(s.value / maxStatus) * 100}%` }} />
              </span>
              <span className="bar-value">{money(s.value)} · {s.count}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

function ManageTeam({ state }) {
  const { opps } = state
  const perf = useMemo(() => {
    return opps.team.map((m) => {
      const assigned = opps.opportunities.filter((o) => o.assignees.some((a) => a.id === m.id))
      const open = assigned.filter(isOpen)
      return {
        ...m,
        led: opps.opportunities.filter((o) => o.lead === m.name).length,
        deals: assigned.length,
        pipeline: open.reduce((s, o) => s + o.estimated_value_musd, 0),
        inReview: open.filter((o) => o.status === 'In Review').length,
        closed: assigned.filter((o) => o.status === 'Closed').length,
      }
    }).sort((a, b) => b.pipeline - a.pipeline)
  }, [opps])
  const maxPipe = Math.max(1, ...perf.map((p) => p.pipeline))

  return (
    <main className="content">
      <h1 className="page-title">Team Performance</h1>
      <p className="welcome-sub">Specialists ranked by open pipeline</p>

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Specialist</th><th>Role</th>
              <th className="num">Deals</th><th className="num">Leads</th>
              <th>Open Pipeline</th>
              <th className="num">In Review</th><th className="num">Closed</th>
            </tr>
          </thead>
          <tbody>
            {perf.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="assignees">
                    <span className="avatar avatar-small" title={p.name}>{p.initials}</span>
                    {p.name}
                  </span>
                </td>
                <td>{p.role}</td>
                <td className="num">{p.deals}</td>
                <td className="num">{p.led}</td>
                <td className="sow-cell">
                  <span className="sow-bar-wrap" style={{ width: 96 }}>
                    <span className="sow-bar" style={{ width: `${(p.pipeline / maxPipe) * 100}%` }} />
                  </span>
                  {money(p.pipeline)}
                </td>
                <td className="num">{p.inReview}</td>
                <td className="num">{p.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function ManageHealth({ state, openClient }) {
  const { fin, eng } = state
  const byId = Object.fromEntries(fin.clients.map((c) => [c.id, c]))
  const attention = eng.clients.filter((c) => c.needs_attention)
  const lowSow = [...fin.clients].filter((c) => c.share_of_wallet_pct < 30)
    .sort((a, b) => a.share_of_wallet_pct - b.share_of_wallet_pct)
  const outflows = fin.clients.filter((c) => c.nnm_ytd_musd < 0)
  const avgSow = Math.round(fin.clients.reduce((s, c) => s + c.share_of_wallet_pct, 0) / fin.clients.length)

  return (
    <main className="content">
      <h1 className="page-title">Book Health</h1>
      <p className="welcome-sub">Risk flags across the book — where management should lean in</p>

      <div className="tile-row">
        <div className="data-tile">
          <div className="tile-value">{attention.length}</div>
          <div className="tile-label">Clients Needing Attention</div>
          <div className="tile-sub">no contact 90+ days</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{lowSow.length}</div>
          <div className="tile-label">Low Share of Wallet</div>
          <div className="tile-sub">below 30%</div>
        </div>
        <div className="data-tile">
          <div className={`tile-value ${outflows.length ? 'neg' : ''}`}>{outflows.length}</div>
          <div className="tile-label">Clients in Net Outflow</div>
          <div className="tile-sub">negative NNM YTD</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{avgSow}%</div>
          <div className="tile-label">Avg. Share of Wallet</div>
          <div className="tile-sub">across the book</div>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Needs Attention</h2><span className="panel-meta">stale relationships</span></div>
          {attention.length === 0 && <p className="welcome-sub">All clients contacted within 90 days.</p>}
          {attention.map((c) => (
            <article key={c.id} className="meeting-item">
              <div className="meeting-main">
                <div className="news-headline">
                  <button type="button" className="client-link" onClick={() => openClient(c.id, c.name)}>{c.name}</button>
                </div>
                <div className="news-meta">
                  Engagement {c.engagement_score}/10 · last contact {c.last_interaction_days} days ago
                  {byId[c.id] && <> · {money(byId[c.id].aum_musd)} AUM</>}
                </div>
              </div>
              <span className="flag">{c.last_interaction_days}d</span>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Low Share of Wallet</h2><span className="panel-meta">consolidation upside</span></div>
          <table className="data-table">
            <thead>
              <tr><th>Client</th><th>Share of Wallet</th><th className="num">AUM ($M)</th></tr>
            </thead>
            <tbody>
              {lowSow.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button type="button" className="client-link" onClick={() => openClient(c.id, c.name)}>{c.name}</button>
                  </td>
                  <td className="sow-cell">
                    <span className="sow-bar-wrap" title={`Book average: ${avgSow}%`}>
                      <span className="sow-bar" style={{ width: `${c.share_of_wallet_pct}%` }} />
                      <span className="sow-avg" style={{ left: `${avgSow}%` }} />
                    </span>
                    {c.share_of_wallet_pct}%
                  </td>
                  <td className="num">{c.aum_musd.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}

const PAGES = ['Overview', 'Team', 'Book Health']

export default function ManagementView({ onSwitchRole }) {
  const { data: fetched, error, reload } = useFetch(loadManagement)
  const [state, setState] = useState(null)

  useEffect(() => { setState(fetched) }, [fetched])

  return (
    <Shell
      roleLabel="Management"
      roleBadgeClass="role-mgmt"
      pages={PAGES}
      initials="DC"
      onSwitchRole={onSwitchRole}
      renderPage={(page, { openClient }) => {
        if (!state) return <main className="content"><PageStatus error={error} reload={reload} /></main>
        if (page === 'Team') return <ManageTeam state={state} />
        if (page === 'Book Health') return <ManageHealth state={state} openClient={openClient} />
        return <ManageOverview state={state} openClient={openClient} />
      }}
    />
  )
}
