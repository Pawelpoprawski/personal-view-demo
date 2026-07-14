/** Tiny dependency-free SVG charts: line sparkline or bar chart. */
export default function Sparkline({
  points, labels = [], type = 'line', color = '#da0000',
  width = 320, height = 72, formatValue = (v) => v,
}) {
  if (!points || points.length < 2) return null
  const pad = 4
  const min = Math.min(...points, 0)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (points.length - 1)
  const y = (v) => height - pad - ((v - min) / range) * (height - pad * 2)
  const x = (i) => pad + i * stepX

  if (type === 'bar') {
    const barW = Math.max(4, stepX * 0.55)
    const zero = y(0)
    return (
      <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img"
           aria-label={`Bar chart, ${points.length} values`}>
        <line x1={pad} x2={width - pad} y1={zero} y2={zero} stroke="#e5e7eb" />
        {points.map((v, i) => (
          <rect key={i}
            x={x(i) - barW / 2}
            y={Math.min(y(v), zero)}
            width={barW}
            height={Math.max(1, Math.abs(y(v) - zero))}
            fill={v >= 0 ? '#498100' : '#bd000c'}>
            <title>{`${labels[i] ?? i}: ${formatValue(v)}`}</title>
          </rect>
        ))}
      </svg>
    )
  }

  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const area = `${path} L${x(points.length - 1)},${height - pad} L${x(0)},${height - pad} Z`
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img"
         aria-label={`Line chart, ${points.length} values`}>
      <path d={area} fill={color} opacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="6" fill="transparent">
          <title>{`${labels[i] ?? i}: ${formatValue(v)}`}</title>
        </circle>
      ))}
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="3" fill={color} />
    </svg>
  )
}
