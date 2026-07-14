import { useCallback } from 'react'
import { fetchClient } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'

export default function Client({ clientId }) {
  const fetcher = useCallback(() => fetchClient(clientId), [clientId])
  const { data, error, reload } = useFetch(fetcher)

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  return (
    <main className="content">
      <div className="client-head">
        <div>
          <h1 className="page-title">{data.name}</h1>
          <p className="welcome-sub">
            {data.segment} · Booking location {data.booking_location} · Domicile {data.domicile}
          </p>
        </div>
        <div className="opp-tags">
          {data.tags.map((t) => <span key={t} className="pill">{t}</span>)}
        </div>
      </div>

      <div className="tile-row">
        <div className="data-tile">
          <div className="tile-value">${data.aum_musd}M</div>
          <div className="tile-label">Assets Under Management</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{data.share_of_wallet_pct}%</div>
          <div className="tile-label">Share of Wallet</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">${data.revenue_ytd_kusd}k</div>
          <div className="tile-label">Revenue YTD</div>
        </div>
        <div className="data-tile">
          <div className={`tile-value ${data.nnm_ytd_musd < 0 ? 'neg' : ''}`}>${data.nnm_ytd_musd}M</div>
          <div className="tile-label">NNM YTD</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">{data.engagement_score}/10</div>
          <div className="tile-label">Engagement Score</div>
          <div className="tile-sub">last contact {data.last_interaction_days} days ago</div>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Asset Allocation</h2></div>
          <table className="data-table">
            <tbody>
              {Object.entries(data.allocation).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td className="num">{v}%</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Liabilities</h2></div>
          <table className="data-table">
            <tbody>
              {Object.entries(data.liabilities).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td className="num">${v.toFixed(1)}M</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Opportunities</h2></div>
          {data.opportunities.length === 0 && <p className="welcome-sub">No opportunities for this client yet.</p>}
          {data.opportunities.map((o) => (
            <article key={o.id} className="news-item">
              <div className="news-date">
                {o.product} · ${o.estimated_value_musd}M ·{' '}
                <span className={`status-tag status-${o.status.replace(' ', '-').toLowerCase()}`}>{o.status}</span>
              </div>
              <div className="news-headline">{o.title}</div>
              <div className="news-meta">{o.rationale}</div>
            </article>
          ))}
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Interactions &amp; News</h2></div>
          {data.interactions.map((i, idx) => (
            <article key={`i${idx}`} className="news-item">
              <div className="news-date">{i.date} · {i.type}</div>
              <div className="news-headline">{i.subject}</div>
            </article>
          ))}
          {data.news.map((n) => (
            <article key={`n${n.id}`} className="news-item">
              <div className="news-date">{n.date} · {n.source}</div>
              <div className="news-headline">{n.headline}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
