/** Score as filled dots, e.g. 7/10. */
export default function ScoreDots({ value, max = 10 }) {
  return (
    <span className="score-dots" role="img" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`score-dot ${i < value ? 'score-dot-on' : ''}`} />
      ))}
      <span className="score-num">{value}/{max}</span>
    </span>
  )
}
