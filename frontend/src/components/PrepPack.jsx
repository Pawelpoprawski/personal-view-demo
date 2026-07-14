import { useEffect, useState } from 'react'
import { fetchPrep } from '../api.js'
import Modal from './Modal.jsx'
import ScoreDots from './ScoreDots.jsx'

export default function PrepPack({ clientId, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchPrep(clientId)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
    return () => { active = false }
  }, [clientId])

  return (
    <Modal title="Meeting Prep Pack" onClose={onClose}>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="loading">Preparing…</p>}
      {data && (
        <div className="prep">
          <div className="prep-client">
            <strong>{data.client.name}</strong> — {data.client.segment}, booked in {data.client.booking_location}
            <div className="prep-stats">
              <span>AUM ${data.client.aum_musd}M</span>
              <span>SoW {data.client.share_of_wallet_pct}%</span>
              <span>Last contact {data.client.last_interaction_days}d ago</span>
              <ScoreDots value={data.client.engagement_score} />
            </div>
            <div className="opp-tags">
              {data.client.tags.map((t) => <span key={t} className="pill">{t}</span>)}
            </div>
          </div>

          <h3 className="prep-h">Talking points</h3>
          <ol className="prep-points">
            {data.talking_points.map((p, i) => <li key={i}>{p}</li>)}
          </ol>

          {data.insights.length > 0 && (
            <>
              <h3 className="prep-h">Talk2GFIW insights</h3>
              {data.insights.map((ins, i) => (
                <p key={i} className="insight"><span className="insight-mark">✦</span>{ins.text}</p>
              ))}
            </>
          )}

          {data.open_opportunities.length > 0 && (
            <>
              <h3 className="prep-h">Open opportunities</h3>
              {data.open_opportunities.map((o) => (
                <p key={o.id} className="prep-line">
                  {o.title} — {o.product}, ${o.estimated_value_musd}M ({o.status})
                </p>
              ))}
            </>
          )}

          {data.recent_interactions.length > 0 && (
            <>
              <h3 className="prep-h">Recent interactions</h3>
              {data.recent_interactions.map((i, idx) => (
                <p key={idx} className="prep-line">{i.date} · {i.type} — {i.subject}</p>
              ))}
            </>
          )}

          {data.news.length > 0 && (
            <>
              <h3 className="prep-h">News</h3>
              {data.news.map((n) => (
                <p key={n.id} className="prep-line">{n.date} — {n.headline}</p>
              ))}
            </>
          )}

          {data.notes.length > 0 && (
            <>
              <h3 className="prep-h">Your notes</h3>
              {data.notes.map((n) => (
                <p key={n.id} className="prep-line"><span className="note-date">{n.created}</span> {n.text}</p>
              ))}
            </>
          )}

          <button type="button" className="btn-outline no-print" onClick={() => window.print()}>
            Print prep pack
          </button>
        </div>
      )}
    </Modal>
  )
}
