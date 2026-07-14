import { useEffect, useState } from 'react'
import { fetchOpportunities, updateOpportunity } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'

export default function Opportunities({ onOpenClient }) {
  const { data: fetched, error, reload } = useFetch(fetchOpportunities)
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => { setData(fetched) }, [fetched])

  async function setStatus(o, status) {
    let updated
    try {
      updated = await updateOpportunity(o.id, { status })
    } catch {
      window.alert('Could not update the opportunity. Check that the backend is running and try again.')
      return
    }
    setData((d) => ({
      ...d,
      opportunities: d.opportunities.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
    }))
  }

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  const shown = data.opportunities.filter((o) => filter === 'All' || o.status === filter)

  return (
    <main className="content">
      <h1 className="page-title">My Opportunities</h1>

      <div className="tile-row">
        <div className="data-tile">
          <div className="tile-value">{data.kpis.open}</div>
          <div className="tile-label">Open Opportunities</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">${data.kpis.pipeline_musd}M</div>
          <div className="tile-label">Estimated Pipeline</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{data.kpis.avg_potential}/10</div>
          <div className="tile-label">Avg. Potential Score</div>
        </div>
      </div>

      <div className="filters">
        {['All', ...data.statuses].map((s) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? 'filter-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {shown.map((o) => (
        <article key={o.id} className="opp-panel">
          <div className="opp-head">
            <div>
              <span className="opp-title">{o.title}</span>
              <span className={`status-tag status-${o.status.replace(' ', '-').toLowerCase()}`}>{o.status}</span>
            </div>
            <div className="opp-value">${o.estimated_value_musd}M</div>
          </div>
          <div className="opp-grid">
            <div>
              <span className="opp-k">Client</span>
              <button type="button" className="client-link" onClick={() => onOpenClient(o.client_id, o.client_name)}>
                {o.client_name}
              </button>
            </div>
            <div><span className="opp-k">Product</span>{o.product}</div>
            <div><span className="opp-k">Potential Score</span>{o.potential_score}/10</div>
            <div><span className="opp-k">Opportunity Lead</span>{o.lead}</div>
            <div><span className="opp-k">Updated</span>{o.updated}</div>
          </div>
          <p className="opp-rationale"><strong>Rationale:</strong> {o.rationale}</p>
          <div className="opp-tags">
            {o.client_tags.map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          {o.status !== 'Closed' && (
            <div className="opp-actions">
              {o.status === 'Open' && (
                <button className="btn-outline" onClick={() => setStatus(o, 'In Review')}>Move to review</button>
              )}
              {o.status === 'In Review' && (
                <button className="btn-outline" onClick={() => setStatus(o, 'Open')}>Back to open</button>
              )}
              <button className="btn-outline" onClick={() => setStatus(o, 'Closed')}>Close</button>
            </div>
          )}
        </article>
      ))}
    </main>
  )
}
