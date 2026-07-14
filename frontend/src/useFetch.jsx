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
  return <p className="loading">Loading…</p>
}
