import { useEffect, useRef, useState } from 'react'
import { search } from '../api.js'

export default function SearchBox({ onOpenClient, onNavigate }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const boxRef = useRef(null)

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return }
    let active = true
    const t = setTimeout(() => {
      search(q).then((r) => active && setResults(r)).catch(() => {})
    }, 200)
    return () => { active = false; clearTimeout(t) }
  }, [q])

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setResults(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function pickClient(c) {
    setQ('')
    setResults(null)
    onOpenClient(c.id, c.name)
  }

  function pickOpportunity(o) {
    setQ('')
    setResults(null)
    onNavigate('My Opportunities')
  }

  const empty = results && results.clients.length === 0 && results.opportunities.length === 0

  return (
    <div className="searchbox" ref={boxRef}>
      <input
        type="search"
        placeholder="Search clients, opportunities…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search"
      />
      {results && (
        <div className="search-results">
          {results.clients.map((c) => (
            <button key={`c${c.id}`} type="button" className="search-item" onClick={() => pickClient(c)}>
              <span className="search-kind">Client</span>
              {c.name} <span className="search-sub">{c.segment} · ${c.aum_musd}M</span>
            </button>
          ))}
          {results.opportunities.map((o) => (
            <button key={`o${o.id}`} type="button" className="search-item" onClick={() => pickOpportunity(o)}>
              <span className="search-kind">Opportunity</span>
              {o.title} <span className="search-sub">{o.client_name} · {o.status}</span>
            </button>
          ))}
          {empty && <div className="search-empty">No matches for “{q}”.</div>}
        </div>
      )}
    </div>
  )
}
