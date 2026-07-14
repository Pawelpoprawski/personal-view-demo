import { useCallback, useState } from 'react'
import { addClientNote, fetchClient, updateClientTags } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'
import Sparkline from '../components/Sparkline.jsx'
import ScoreDots from '../components/ScoreDots.jsx'
import Notes from '../components/Notes.jsx'

function Yoy({ value, suffix = '%' }) {
  if (value === undefined) return null
  const up = value >= 0
  return (
    <span className={`yoy ${up ? 'delta-up' : 'delta-down'}`}>
      {up ? '▲' : '▼'} {value > 0 ? '+' : ''}{value}{suffix} YoY
    </span>
  )
}

function Tags({ clientId, tags: initial }) {
  const [tags, setTags] = useState(initial)
  const [adding, setAdding] = useState('')

  async function save(next) {
    try {
      const res = await updateClientTags(clientId, next)
      setTags(res.tags)
    } catch {
      window.alert('Could not update tags. Try again.')
    }
  }

  function add(e) {
    e.preventDefault()
    const t = adding.trim()
    if (t && !tags.includes(t)) save([...tags, t])
    setAdding('')
  }

  return (
    <div className="opp-tags">
      {tags.map((t) => (
        <span key={t} className="pill pill-removable" title="Click × to remove">
          {t}
          <button type="button" className="pill-x" aria-label={`Remove tag ${t}`}
                  onClick={() => save(tags.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <form className="tag-form" onSubmit={add}>
        <input className="tag-input" placeholder="Tag client…" value={adding} maxLength={40}
               onChange={(e) => setAdding(e.target.value)} />
      </form>
    </div>
  )
}

export default function Client({ clientId }) {
  const fetcher = useCallback(() => fetchClient(clientId), [clientId])
  const { data, error, reload } = useFetch(fetcher)

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  const months = data.history.map((h) => h.month)

  return (
    <main className="content client-page">
      <div className="client-head">
        <div>
          <h1 className="page-title">{data.name}</h1>
          <p className="welcome-sub">
            {data.segment} · Booking location {data.booking_location} · Domicile {data.domicile}
          </p>
        </div>
        <div className="client-head-right">
          <button type="button" className="btn-outline no-print" onClick={() => window.print()}>
            Print one-pager
          </button>
        </div>
      </div>

      <Tags clientId={data.id} tags={data.tags} />

      <div className="tile-row">
        <div className="data-tile">
          <div className="tile-value">${data.aum_musd}M</div>
          <div className="tile-label">Assets Under Management</div>
          <Yoy value={data.yoy.aum_yoy_pct} />
        </div>
        <div className="data-tile">
          <div className="tile-value">{data.share_of_wallet_pct}%</div>
          <div className="tile-label">Share of Wallet</div>
          <Yoy value={data.yoy.sow_yoy_pp} suffix="pp" />
        </div>
        <div className="data-tile">
          <div className="tile-value">${data.revenue_ytd_kusd}k</div>
          <div className="tile-label">Revenue YTD</div>
          <Yoy value={data.yoy.revenue_yoy_pct} />
        </div>
        <div className="data-tile">
          <div className={`tile-value ${data.nnm_ytd_musd < 0 ? 'neg' : ''}`}>${data.nnm_ytd_musd}M</div>
          <div className="tile-label">NNM YTD</div>
          <div className="tile-sub">prev. year ${data.yoy.nnm_prev_musd}M</div>
        </div>
        <div className="data-tile">
          <div className="tile-value"><ScoreDots value={data.engagement_score} /></div>
          <div className="tile-label">Engagement Score</div>
          <div className="tile-sub">last contact {data.last_interaction_days} days ago</div>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>AUM — last 12 months</h2></div>
          <Sparkline points={data.history.map((h) => h.aum_musd)} labels={months}
                     width={460} height={110} formatValue={(v) => `$${v}M`} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Revenue — monthly ($k)</h2></div>
          <Sparkline type="bar" points={data.history.map((h) => h.revenue_kusd)} labels={months}
                     width={460} height={110} formatValue={(v) => `$${v}k`} />
        </section>
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

      <section className="panel no-print">
        <div className="panel-head"><h2>Notes</h2></div>
        <Notes notes={data.notes} onAdd={(text) => addClientNote(data.id, text)} />
      </section>
    </main>
  )
}
