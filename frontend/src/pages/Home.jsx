import { useEffect, useState } from 'react'
import { addActionNote, createAction, fetchHome, talk, updateAction } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'
import Sparkline from '../components/Sparkline.jsx'
import Modal from '../components/Modal.jsx'
import Notes from '../components/Notes.jsx'

function NewActionModal({ clients, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', client_id: clients[0]?.id, detail: '', due: '', priority: 'medium' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      onCreated(await createAction({ ...form, client_id: Number(form.client_id) }))
      onClose()
    } catch {
      window.alert('Could not create the action. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="New Action" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label>Title
          <input className="cell-input" required minLength={3} value={form.title} onChange={set('title')} />
        </label>
        <label>Client
          <select className="cell-input" value={form.client_id} onChange={set('client_id')}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Detail
          <input className="cell-input" value={form.detail} onChange={set('detail')} />
        </label>
        <div className="modal-row">
          <label>Due date
            <input className="cell-input" type="date" value={form.due} onChange={set('due')} />
          </label>
          <label>Priority
            <select className="cell-input" value={form.priority} onChange={set('priority')}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>Create action</button>
      </form>
    </Modal>
  )
}

function Talk2GFIW({ insights, onOpenClient }) {
  const [thread, setThread] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(e) {
    e.preventDefault()
    const question = q.trim()
    if (!question) return
    setBusy(true)
    setQ('')
    setThread((t) => [...t, { who: 'you', text: question }])
    try {
      const { answer } = await talk(question)
      setThread((t) => [...t, { who: 'gfiw', text: answer }])
    } catch {
      setThread((t) => [...t, { who: 'gfiw', text: 'Something went wrong — ask again.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel talk-panel">
      <div className="panel-head">
        <h2>Talk2GFIW</h2>
        <span className="panel-meta">insights from your book</span>
      </div>
      {insights.map((ins, i) => (
        <p key={i} className="insight">
          <span className="insight-mark">✦</span>
          {ins.text}{' '}
          <button type="button" className="client-link" onClick={() => onOpenClient(ins.client_id, ins.client_name)}>
            View client
          </button>
        </p>
      ))}
      {thread.map((m, i) => (
        <p key={`t${i}`} className={m.who === 'you' ? 'talk-you' : 'talk-answer'}>
          {m.who === 'you' ? 'You: ' : ''}{m.text}
        </p>
      ))}
      <form className="note-form" onSubmit={ask}>
        <input
          className="cell-input"
          placeholder="Ask about a client, AUM, pipeline…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-outline" disabled={busy || !q.trim()}>Ask</button>
      </form>
    </section>
  )
}

export default function Home({ onNavigate, onOpenClient }) {
  const { data: fetched, error, reload } = useFetch(fetchHome)
  const [data, setData] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { setData(fetched) }, [fetched])

  function recompute(actions) {
    const completed = actions.filter((x) => x.status === 'Completed').length
    return {
      open: actions.length - completed,
      completed,
      completion_rate_pct: Math.round((100 * completed) / actions.length),
    }
  }

  async function toggleAction(a) {
    const next = a.status === 'Open' ? 'Completed' : 'Open'
    let updated
    try {
      updated = await updateAction(a.id, { status: next })
    } catch {
      window.alert('Could not update the action. Check that the backend is running and try again.')
      return
    }
    setData((d) => {
      const actions = d.actions.map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
      return { ...d, actions, action_metrics: recompute(actions) }
    })
  }

  function onCreated(action) {
    setData((d) => {
      const actions = [action, ...d.actions]
      return { ...d, actions, action_metrics: recompute(actions) }
    })
  }

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  const months = data.history.map((h) => h.month)

  return (
    <main className="content">
      <h1 className="welcome">Welcome back, {data.advisor.name}</h1>
      <p className="welcome-sub">{data.advisor.desk}</p>

      <div className="tile-row">
        <button type="button" className="data-tile clickable" onClick={() => onNavigate('My Financials')}>
          <div className="tile-value">${data.kpis.aum_musd}M</div>
          <div className="tile-label">Assets Under Management</div>
          <Sparkline points={data.history.map((h) => h.aum_musd)} labels={months}
                     width={220} height={44} formatValue={(v) => `$${v}M`} />
        </button>
        <button type="button" className="data-tile clickable" onClick={() => onNavigate('My Opportunities')}>
          <div className="tile-value">{data.kpis.open_opportunities}</div>
          <div className="tile-label">Open Opportunities</div>
        </button>
        <button type="button" className="data-tile clickable" onClick={() => onNavigate('My Engagement')}>
          <div className="tile-value">{data.kpis.engagement_score}</div>
          <div className="tile-label">Client Engagement Score</div>
        </button>
        <div className="data-tile">
          <div className="tile-value">{data.kpis.clients}</div>
          <div className="tile-label">Clients in Book</div>
        </div>
      </div>

      <Talk2GFIW insights={data.insights} onOpenClient={onOpenClient} />

      <div className="home-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>My Actions</h2>
            <div className="panel-head-right">
              <span className="panel-meta">
                {data.action_metrics.open} open · {data.action_metrics.completion_rate_pct}% completed
              </span>
              <button type="button" className="btn-outline" onClick={() => setShowNew(true)}>+ New Action</button>
            </div>
          </div>
          {data.actions.map((a) => (
            <article key={a.id} className={`action-card ${a.status === 'Completed' ? 'action-done' : ''}`}>
              <div className="action-main">
                <div className="action-title-row">
                  <span className={`priority-dot priority-${a.priority}`} />
                  <span className="action-title">{a.title}</span>
                </div>
                <p className="action-note">{a.note}</p>
                <p className="action-detail">{a.detail}</p>
                <div className="action-meta">
                  <button type="button" className="client-link" onClick={() => onOpenClient(a.client_id, a.client_name)}>
                    {a.client_name}
                  </button>
                  <span>Due {a.due}</span>
                </div>
                <Notes compact notes={a.notes ?? []} onAdd={(text) => addActionNote(a.id, text)} />
              </div>
              <button type="button" className="btn-outline" onClick={() => toggleAction(a)}>
                {a.status === 'Open' ? 'Mark done' : 'Reopen'}
              </button>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Client News</h2>
          </div>
          {data.news.map((n) => (
            <article key={n.id} className="news-item">
              <div className="news-date">{n.date}</div>
              <div className="news-headline">{n.headline}</div>
              <div className="news-meta">
                <button type="button" className="client-link" onClick={() => onOpenClient(n.client_id, n.client_name)}>
                  {n.client_name}
                </button>
                {' '}· {n.source}
              </div>
            </article>
          ))}
        </section>
      </div>

      {showNew && <NewActionModal clients={data.clients} onClose={() => setShowNew(false)} onCreated={onCreated} />}
    </main>
  )
}
