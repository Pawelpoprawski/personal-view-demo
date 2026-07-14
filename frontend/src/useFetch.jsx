import { useCallback, useEffect, useState } from 'react'

/**
 * Data-fetching hook shared by all pages.
 * Ignores stale responses (rapid tab switches / unmount) and exposes reload().
 */
export function useFetch(fetcher) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => {
    setData(null)
    setError('')
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let active = true
    fetcher()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
    return () => { active = false }
  }, [fetcher, tick])

  return { data, error, reload }
}

export function PageStatus({ error, reload }) {
  if (error) {
    return (
      <div className="page-status">
        <p className="error">{error}</p>
        <button type="button" className="btn-outline" onClick={reload}>Try again</button>
      </div>
    )
  }
  // Skeleton placeholders while loading
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="tile-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="data-tile">
            <div className="skeleton skeleton-value" />
            <div className="skeleton skeleton-label" />
          </div>
        ))}
      </div>
      <div className="panel">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton-row" />)}
      </div>
    </div>
  )
}
