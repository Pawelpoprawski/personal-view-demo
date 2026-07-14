import { useEffect, useState } from 'react'
import { fetchHome, updateAction } from '../api.js'

export default function Home({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHome().then(setData).catch((e) => setError(e.message))
  }, [])

  async function toggleAction(a) {
    const next = a.status === 'Open' ? 'Completed' : 'Open'
    const updated = await updateAction(a.id, { status: next })
    setData((d) => {
      const actions = d.actions.map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
      const completed = actions.filter((x) => x.status === 'Completed').length
      return {
        ...d,
        actions,
        action_metrics: {
          open: actions.length - completed,
          completed,
          completion_rate_pct: Math.round((100 * completed) / actions.length),
        },
      }
    })
  }

  if (error) return <main className="content"><p className="error">{error}</p></main>
  if (!data) return <main className="content"><p className="loading">Loading…</p></main>

  return (
    <main className="content">
      <h1 className="welcome">Welcome back, {data.advisor.name}</h1>
      <p className="welcome-sub">{data.advisor.desk}</p>

      <div className="tile-row">
        <button className="data-tile clickable" onClick={() => onNavigate('My Financials')}>
          <div className="tile-value">${data.kpis.aum_musd}M</div>
          <div className="tile-label">Assets Under Management</div>
        </button>
        <button className="data-tile clickable" onClick={() => onNavigate('My Opportunities')}>
          <div className="tile-value">{data.kpis.open_opportunities}</div>
          <div className="tile-label">Open Opportunities</div>
        </button>
        <button className="data-tile clickable" onClick={() => onNavigate('My Engagement')}>
          <div className="tile-value">{data.kpis.engagement_score}</div>
          <div className="tile-label">Client Engagement Score</div>
        </button>
        <div className="data-tile">
          <div className="tile-value">{data.kpis.clients}</div>
          <div className="tile-label">Clients in Book</div>
        </div>
      </div>

      <div className="home-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>My Actions</h2>
            <span className="panel-meta">
              {data.action_metrics.open} open · {data.action_metrics.completion_rate_pct}% completed
            </span>
          </div>
          {data.actions.map((a) => (
            <article key={a.id} className={`action-card ${a.status === 'Completed' ? 'action-done' : ''}`}>
              <div className="action-main">
                <div className="action-title-row">
                  <span className={`priority-dot priority-${a.priority}`} />
                  <span className="action-title">{a.title}</span>
                </div>
                <p className="action-note">{a.note}</p>
                <p className="action-detail">{a.detail}</p>
                <div className="action-meta">
                  <span>{a.client_name}</span>
                  <span>Due {a.due}</span>
                </div>
              </div>
              <button className="btn-outline" onClick={() => toggleAction(a)}>
                {a.status === 'Open' ? 'Mark done' : 'Reopen'}
              </button>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Client News</h2>
          </div>
          {data.news.map((n) => (
            <article key={n.id} className="news-item">
              <div className="news-date">{n.date}</div>
              <div className="news-headline">{n.headline}</div>
              <div className="news-meta">{n.client_name} · {n.source}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
