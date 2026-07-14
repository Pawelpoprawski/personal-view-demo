import { useMemo, useState } from 'react'
import { fetchFinancials } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'
import Sparkline from '../components/Sparkline.jsx'

const DONUT_COLORS = ['#1c1c1c', '#da0000', '#919191', '#dfc06d']

function Donut({ allocation }) {
  let acc = 0
  const stops = allocation.map((a, i) => {
    const from = acc
    acc += a.pct
    return `${DONUT_COLORS[i]} ${from}% ${acc}%`
  })
  const top = allocation.reduce((m, a) => (a.pct > m.pct ? a : m), allocation[0])
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})` }}
           title={allocation.map((a) => `${a.class}: ${a.pct}%`).join(' · ')}>
        <div className="donut-hole">
          <span className="donut-center-pct">{top.pct}%</span>
          <span className="donut-center-name">{top.class}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {allocation.map((a, i) => (
          <li key={a.class} title={`${a.class}: $${a.musd}M (${a.pct}%)`}>
            <span className="legend-swatch" style={{ background: DONUT_COLORS[i] }} />
            <span className="legend-name">{a.class}</span>
            <span className="legend-val">${a.musd}M ({a.pct}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const COLUMNS = [
  { key: 'name', label: 'Client', num: false },
  { key: 'segment', label: 'Segment', num: false },
  { key: 'aum_musd', label: 'AUM ($M)', num: true },
  { key: 'share_of_wallet_pct', label: 'Share of Wallet', num: true },
  { key: 'revenue_ytd_kusd', label: 'Revenue YTD ($k)', num: true },
  { key: 'nnm_ytd_musd', label: 'NNM YTD ($M)', num: true },
  { key: 'loans_musd', label: 'Loans ($M)', num: true },
  { key: 'mortgages_musd', label: 'Mortgages ($M)', num: true },
]

export default function Financials({ onOpenClient }) {
  const { data, error, reload } = useFetch(fetchFinancials)
  const [sort, setSort] = useState({ key: 'aum_musd', dir: -1 })

  const rows = useMemo(() => {
    if (!data) return []
    const rs = [...data.clients]
    rs.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key]
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
      return cmp * sort.dir
    })
    return rs
  }, [data, sort])

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  const months = data.history.map((h) => h.month)

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: -1 }))
  }

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
          <div className="panel-head"><h2>AUM — last 12 months</h2></div>
          <Sparkline points={data.history.map((h) => h.aum_musd)} labels={months}
                     width={460} height={120} formatValue={(v) => `$${v}M`} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Net New Money — monthly</h2></div>
          <Sparkline type="bar" points={data.history.map((h) => h.nnm_musd)} labels={months}
                     width={460} height={120} formatValue={(v) => `$${v}M`} />
        </section>
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
              {COLUMNS.map((c) => (
                <th key={c.key} className={c.num ? 'num' : ''}>
                  <button type="button" className="sort-btn" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    <span className="sort-arrow">
                      {sort.key === c.key ? (sort.dir === -1 ? ' ▼' : ' ▲') : ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <button type="button" className="client-link" onClick={() => onOpenClient(c.id, c.name)}>
                    {c.name}
                  </button>
                </td>
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
