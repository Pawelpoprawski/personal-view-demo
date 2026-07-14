import { useEffect, useState } from 'react'
import { createOpportunity, fetchOpportunities, updateOpportunity } from '../api.js'
import { useFetch, PageStatus } from '../useFetch.jsx'
import ScoreDots from '../components/ScoreDots.jsx'
import Modal from '../components/Modal.jsx'

function OpportunityForm({ initial, clients, products, submitLabel, onSubmit, showScore }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit(form)
    } catch {
      window.alert('Could not save the opportunity. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Title
        <input className="cell-input" required minLength={3} value={form.title} onChange={set('title')} />
      </label>
      {clients && (
        <label>Client
          <select className="cell-input" value={form.client_id} onChange={set('client_id')}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      <div className="modal-row">
        <label>Product
          <select className="cell-input" value={form.product} onChange={set('product')}>
            {products.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label>Estimated value ($M)
          <input className="cell-input" type="number" min="0" step="0.5" required
                 value={form.estimated_value_musd} onChange={set('estimated_value_musd')} />
        </label>
      </div>
      {showScore && (
        <label>Potential score (1–10)
          <input className="cell-input" type="number" min="1" max="10" required
                 value={form.potential_score} onChange={set('potential_score')} />
        </label>
      )}
      <label>Rationale
        <textarea className="cell-input" rows={3} maxLength={500}
                  value={form.rationale} onChange={set('rationale')} />
      </label>
      <button type="submit" className="btn-primary" disabled={busy}>{submitLabel}</button>
    </form>
  )
}

function Assignees({ opp, team, onChange }) {
  const assigned = new Set(opp.assignees.map((a) => a.id))
  const available = team.filter((t) => !assigned.has(t.id))

  async function toggle(id, add) {
    const next = add ? [...assigned, id] : [...assigned].filter((x) => x !== id)
    onChange(await updateOpportunity(opp.id, { assignees: next }))
  }

  return (
    <div className="assignees">
      {opp.assignees.map((a) => (
        <button key={a.id} type="button" className="avatar avatar-small" title={`${a.name} (${a.role}) — click to remove`}
                onClick={() => toggle(a.id, false)}>
          {a.initials}
        </button>
      ))}
      {available.length > 0 && (
        <select
          className="assignee-add"
          value=""
          aria-label="Add assignee"
          onChange={(e) => e.target.value && toggle(Number(e.target.value), true)}
        >
          <option value="">+ Assign</option>
          {available.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.role}</option>)}
        </select>
      )}
    </div>
  )
}

export default function Opportunities({ onOpenClient }) {
  const { data: fetched, error, reload } = useFetch(fetchOpportunities)
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { setData(fetched) }, [fetched])

  function replace(updated) {
    setData((d) => ({
      ...d,
      opportunities: d.opportunities.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
    }))
  }

  async function setStatus(o, status) {
    try {
      replace(await updateOpportunity(o.id, { status }))
    } catch {
      window.alert('Could not update the opportunity. Check that the backend is running and try again.')
    }
  }

  if (!data) return <main className="content"><PageStatus error={error} reload={reload} /></main>

  const shown = data.opportunities.filter((o) => filter === 'All' || o.status === filter)
  const openItems = data.opportunities.filter((o) => o.status !== 'Closed')
  const pipeline = Math.round(openItems.reduce((s, o) => s + Number(o.estimated_value_musd), 0) * 10) / 10

  return (
    <main className="content">
      <div className="page-head">
        <h1 className="page-title">My Opportunities</h1>
        <button type="button" className="btn-primary" onClick={() => setShowNew(true)}>+ New Opportunity</button>
      </div>

      <div className="tile-row">
        <div className="data-tile">
          <div className="tile-value">{openItems.length}</div>
          <div className="tile-label">Open Opportunities</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">${pipeline}M</div>
          <div className="tile-label">Estimated Pipeline</div>
        </div>
        <div className="data-tile">
          <div className="tile-value">
            {openItems.length ? Math.round(openItems.reduce((s, o) => s + o.potential_score, 0) / openItems.length * 10) / 10 : 0}/10
          </div>
          <div className="tile-label">Avg. Potential Score</div>
        </div>
      </div>

      <div className="filters">
        {['All', ...data.statuses].map((s) => (
          <button
            key={s}
            type="button"
            className={`filter-pill ${filter === s ? 'filter-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {shown.map((o) => (
        <article key={o.id} className="opp-panel">
          <div className="opp-head">
            <div>
              <span className="opp-title">{o.title}</span>
              <span className={`status-tag status-${o.status.replace(' ', '-').toLowerCase()}`}>{o.status}</span>
            </div>
            <div className="opp-value">${o.estimated_value_musd}M</div>
          </div>
          <div className="opp-grid">
            <div>
              <span className="opp-k">Client</span>
              <button type="button" className="client-link" onClick={() => onOpenClient(o.client_id, o.client_name)}>
                {o.client_name}
              </button>
            </div>
            <div><span className="opp-k">Product</span>{o.product}</div>
            <div><span className="opp-k">Potential Score</span><ScoreDots value={o.potential_score} /></div>
            <div><span className="opp-k">Opportunity Lead</span>{o.lead}</div>
            <div><span className="opp-k">Updated</span>{o.updated}</div>
            <div><span className="opp-k">Team</span><Assignees opp={o} team={data.team} onChange={replace} /></div>
          </div>
          <p className="opp-rationale"><strong>Rationale:</strong> {o.rationale}</p>
          <div className="opp-tags">
            {(o.client_tags ?? []).map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
          <div className="opp-actions">
            <button type="button" className="btn-outline" onClick={() => setEditing(o)}>Edit</button>
            {o.status === 'Open' && (
              <button type="button" className="btn-outline" onClick={() => setStatus(o, 'In Review')}>Move to review</button>
            )}
            {o.status === 'In Review' && (
              <button type="button" className="btn-outline" onClick={() => setStatus(o, 'Open')}>Back to open</button>
            )}
            {o.status !== 'Closed' && (
              <button type="button" className="btn-outline" onClick={() => setStatus(o, 'Closed')}>Close</button>
            )}
            {o.status === 'Closed' && (
              <button type="button" className="btn-outline" onClick={() => setStatus(o, 'Open')}>Reopen</button>
            )}
          </div>
        </article>
      ))}

      {showNew && (
        <Modal title="New Opportunity" onClose={() => setShowNew(false)}>
          <OpportunityForm
            initial={{
              title: '', client_id: data.client_options[0]?.id,
              product: data.products[0], estimated_value_musd: 5, rationale: '',
            }}
            clients={data.client_options}
            products={data.products}
            submitLabel="Create opportunity"
            onSubmit={async (form) => {
              const created = await createOpportunity({
                ...form,
                client_id: Number(form.client_id),
                estimated_value_musd: Number(form.estimated_value_musd),
              })
              setData((d) => ({ ...d, opportunities: [created, ...d.opportunities] }))
              setShowNew(false)
            }}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit: ${editing.title}`} onClose={() => setEditing(null)}>
          <OpportunityForm
            initial={{
              title: editing.title, product: editing.product,
              estimated_value_musd: editing.estimated_value_musd,
              potential_score: editing.potential_score,
              rationale: editing.rationale,
            }}
            products={data.products}
            showScore
            submitLabel="Save changes"
            onSubmit={async (form) => {
              replace(await updateOpportunity(editing.id, {
                title: form.title,
                product: form.product,
                estimated_value_musd: Number(form.estimated_value_musd),
                potential_score: Number(form.potential_score),
                rationale: form.rationale,
              }))
              setEditing(null)
            }}
          />
        </Modal>
      )}
    </main>
  )
}
