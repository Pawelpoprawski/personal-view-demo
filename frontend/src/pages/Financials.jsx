import { useEffect, useState } from 'react'
import { fetchFinancials } from '../api.js'

const DONUT_COLORS = ['#1c1c1c', '#da0000', '#919191', '#dfc06d']

function Donut({ allocation }) {
  let acc = 0
  const stops = allocation.map((a, i) => {
    const from = acc
    acc += a.pct
    return `${DONUT_COLORS[i]} ${from}% ${acc}%`
  })
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
        <div className="donut-hole" />
      </div>
      <ul className="donut-legend">
        {allocation.map((a, i) => (
          <li key={a.class}>
            <span className="legend-swatch" style={{ background: DONUT_COLORS[i] }} />
            <span className="legend-name">{a.class}</span>
            <span className="legend-val">${a.musd}M ({a.pct}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Financials() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFinancials().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <main className="content"><p className="error">{error}</p></main>
  if (!data) return <main className="content"><p className="loading">Loading…</p></main>

  return (
    <main className="content">
      <h1 className="page-title">My Financials</h1>

      <div className="tile-row">
        {data.tiles.map((t) => (
          <div key={t.key} className="data-tile">
            <div className="tile-value">${t.value_musd}M</div>
            <div className="tile-label">{t.label}</div>
            <div className={`tile-delta ${t.direction === 'up' ? 'delta-up' : 'delta-down'}`}>
              {t.direction === 'up' ? '▲' : '▼'} {t.delta_musd > 0 ? '+' : ''}${t.delta_musd}M vs. last quarter
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Asset Allocation</h2></div>
          <Donut allocation={data.allocation} />
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Liabilities</h2></div>
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th className="num">Amount ($M)</th></tr>
            </thead>
            <tbody>
              {data.liabilities.map((l) => (
                <tr key={l.type}>
                  <td>{l.type}</td>
                  <td className="num">{l.musd.toFixed(1)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td className="num">
                  {data.liabilities.reduce((s, l) => s + l.musd, 0).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Per Client</h2></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Segment</th>
              <th className="num">AUM ($M)</th>
              <th className="num">Share of Wallet</th>
              <th className="num">Revenue YTD ($k)</th>
              <th className="num">NNM YTD ($M)</th>
              <th className="num">Loans ($M)</th>
              <th className="num">Mortgages ($M)</th>
            </tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.segment}</td>
                <td className="num">{c.aum_musd.toFixed(1)}</td>
                <td className="num">{c.share_of_wallet_pct}%</td>
                <td className="num">{c.revenue_ytd_kusd}</td>
                <td className={`num ${c.nnm_ytd_musd < 0 ? 'neg' : 'pos'}`}>{c.nnm_ytd_musd.toFixed(1)}</td>
                <td className="num">{c.loans_musd.toFixed(1)}</td>
                <td className="num">{c.mortgages_musd.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
