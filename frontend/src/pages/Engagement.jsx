import { useEffect, useState } from 'react'
import { fetchEngagement } from '../api.js'

export default function Engagement() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEngagement().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <main className="content"><p className="error">{error}</p></main>
  if (!data) return <main className="content"><p className="loading">Loading…</p></main>

  return (
    <main className="content">
      <h1 className="page-title">My Engagement</h1>

      <div className="tile-row">
        {data.tiles.map((t) => (
          <div key={t.label} className="data-tile">
            <div className="tile-value">{t.value}</div>
            <div className="tile-label">{t.label}</div>
            <div className="tile-sub">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Engagement by Client</h2></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="num">Score</th>
                <th className="num">Last interaction</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="num">{c.engagement_score}/10</td>
                  <td className="num">{c.last_interaction_days} days ago</td>
                  <td>
                    {c.needs_attention && <span className="flag">No contact 90+ days</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Recent Interactions</h2></div>
          {data.interactions.map((i, idx) => (
            <article key={idx} className="news-item">
              <div className="news-date">{i.date} · {i.type}{i.with_specialist ? ' · with specialist' : ''}</div>
              <div className="news-headline">{i.subject}</div>
              <div className="news-meta">{i.client_name}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
