/** Conic-gradient donut with legend. `allocation`: [{ class, pct, musd }]. */
const DONUT_COLORS = ['#1c1c1c', '#da0000', '#919191', '#dfc06d', '#498100']

export default function Donut({ allocation }) {
  let acc = 0
  const stops = allocation.map((a, i) => {
    const from = acc
    acc += a.pct
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}% ${acc}%`
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
            <span className="legend-swatch" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="legend-name">{a.class}</span>
            <span className="legend-val">${a.musd}M ({a.pct}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
