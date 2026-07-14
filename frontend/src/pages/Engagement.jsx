import { useEffect, useState } from 'react'
import { createInteraction, fetchEngagement } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'
import ScoreDots from '../components/ScoreDots.jsx'
import Modal from '../components/Modal.jsx'

function NewInteractionModal({ clients, types, onClose, onCreated }) {
  const [form, setForm] = useState({
    client_id: clients[0]?.id, type: types[0], subject: '', with_specialist: false,
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      onCreated(await createInteraction({
        ...form,
        client_id: Number(form.client_id),
        with_specialist: Boolean(form.with_specialist),
      }))
      onClose()
    } catch {
      window.alert('Could not log the interaction. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Log Interaction" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label>Client
          <select className="cell-input" value={form.client_id} onChange={set('client_id')}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Type
          <select className="cell-input" value={form.type} onChange={set('type')}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Subject
          <input className="cell-input" required minLength={3} value={form.subject} onChange={set('subject')} />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.with_specialist}
            onChange={(e) => setForm((f) => ({ ...f, with_specialist: e.target.checked }))}
          />
          Specialist attended
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>Log interaction</button>
      </form>
    </Modal>
  )
}

export default function Engagement({ onOpenClient }) {
  const { data: fetched, error, reload } = useFetch(fetchEngagement)
  const [data, setData] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { setData(fetched) }, [fetched])

  function onCreated(interaction) {
    setData((d) => ({
      ...d,
      interactions: [interaction, ...d.interactions],
      clients: d.clients.map((c) =>
        c.id === interaction.client_id
          ? { ...c, last_interaction_days: 0, needs_attention: false }
          : c
      ),
    }))
  }

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  return (
    <main className="content">
      <h1 className="page-title">My Engagement</h1>

      <div className="tile-row">
        {data.tiles.map((t) => (
          <div key={t.label} className="data-tile">
            <div className="tile-value">{t.value}</div>
            <div className="tile-label">{t.label}</div>
            <div className="tile-sub">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Engagement by Client</h2></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Score</th>
                <th className="num">Last interaction</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button type="button" className="client-link" onClick={() => onOpenClient(c.id, c.name)}>
                      {c.name}
                    </button>
                  </td>
                  <td><ScoreDots value={c.engagement_score} /></td>
                  <td className="num">{c.last_interaction_days === 0 ? 'today' : `${c.last_interaction_days} days ago`}</td>
                  <td>
                    {c.needs_attention && <span className="flag">No contact 90+ days</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Interaction Timeline</h2>
            <button type="button" className="btn-outline" onClick={() => setShowNew(true)}>+ Log interaction</button>
          </div>
          <div className="timeline">
            {data.interactions.map((i, idx) => (
              <article key={idx} className="timeline-item">
                <span className={`timeline-dot timeline-${i.type.toLowerCase()}`} />
                <div>
                  <div className="news-date">{i.date} · {i.type}{i.with_specialist ? ' · with specialist' : ''}</div>
                  <div className="news-headline">{i.subject}</div>
                  <div className="news-meta">{i.client_name}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {showNew && (
        <NewInteractionModal
          clients={data.client_options}
          types={data.interaction_types}
          onClose={() => setShowNew(false)}
          onCreated={onCreated}
        />
      )}
    </main>
  )
}
