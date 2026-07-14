import { useState } from 'react'
import { updateProposal } from './api.js'

function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t}
          className={`tab ${t === active ? 'tab-active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Client Advisor ---------------- */

function AdvisorView({ data }) {
  const tabs = ['Overview', 'Clients', 'Revenues', 'Invested Assets']
  const [tab, setTab] = useState(tabs[0])
  const k = data.kpis

  return (
    <>
      <div className="kpi-row">
        <Kpi label="My clients" value={k.total_clients} />
        <Kpi label="Invested assets (mUSD)" value={k.invested_assets_musd} />
        <Kpi label="Revenue YTD (kUSD)" value={k.revenue_ytd_kusd} />
        <Kpi label="NNM YTD (mUSD)" value={k.nnm_ytd_musd} />
        <Kpi label="Reviews pending" value={k.reviews_pending} />
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <table className="data-table">
          <thead>
            <tr><th>Client</th><th>Segment</th><th>Domicile</th><th>Mandate</th><th>Risk profile</th><th>Review</th></tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.segment}</td><td>{c.domicile}</td>
                <td>{c.mandate}</td><td>{c.risk_profile}</td>
                <td>{c.needs_review ? <span className="flag">Pending</span> : 'OK'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Clients' && (
        <table className="data-table">
          <thead>
            <tr><th>Client</th><th>Segment</th><th>Invested assets (mUSD)</th><th>Cash (mUSD)</th><th>YTD %</th><th>Products</th></tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.segment}</td>
                <td className="num">{c.invested_assets_musd.toFixed(1)}</td>
                <td className="num">{c.cash_musd.toFixed(1)}</td>
                <td className={`num ${c.ytd_return_pct >= 5 ? 'pos' : ''}`}>{c.ytd_return_pct.toFixed(1)}</td>
                <td>{c.open_products.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Revenues' && (
        <table className="data-table">
          <thead>
            <tr><th>Client</th><th>Revenue YTD (kUSD)</th><th>NNM YTD (mUSD)</th><th>RoA (bps)</th></tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="num">{c.revenue_ytd_kusd}</td>
                <td className={`num ${c.nnm_ytd_musd < 0 ? 'neg' : 'pos'}`}>{c.nnm_ytd_musd.toFixed(1)}</td>
                <td className="num">{Math.round((c.revenue_ytd_kusd / 1000 / c.invested_assets_musd) * 10000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Invested Assets' && (
        <table className="data-table">
          <thead>
            <tr><th>Client</th><th>Invested assets (mUSD)</th><th>Cash (mUSD)</th><th>Cash %</th><th>Mandate</th></tr>
          </thead>
          <tbody>
            {data.clients.map((c) => {
              const cashPct = (c.cash_musd / (c.invested_assets_musd + c.cash_musd)) * 100
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="num">{c.invested_assets_musd.toFixed(1)}</td>
                  <td className="num">{c.cash_musd.toFixed(1)}</td>
                  <td className={`num ${cashPct > 10 ? 'neg' : ''}`}>{cashPct.toFixed(1)}</td>
                  <td>{c.mandate}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}

/* ---------------- Specialist (Sales) ---------------- */

function ProposalRow({ p, statuses, token, onSaved }) {
  const [status, setStatus] = useState(p.status)
  const [volume, setVolume] = useState(p.expected_volume_musd)
  const [comment, setComment] = useState(p.comment)
  const [saving, setSaving] = useState(false)
  const dirty = status !== p.status || Number(volume) !== p.expected_volume_musd || comment !== p.comment

  async function save() {
    setSaving(true)
    try {
      const updated = await updateProposal(token, p.id, {
        status,
        expected_volume_musd: Number(volume),
        comment,
      })
      onSaved(updated)
    } catch {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td>{p.client_name}</td>
      <td>{p.segment}</td>
      <td>{p.product}</td>
      <td className="rationale">{p.rationale}</td>
      <td>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </td>
      <td>
        <input className="cell-input num" type="number" step="0.5" value={volume}
               onChange={(e) => setVolume(e.target.value)} />
      </td>
      <td>
        <input className="cell-input" value={comment} placeholder="Add comment…"
               onChange={(e) => setComment(e.target.value)} />
      </td>
      <td>
        <button className="btn-small" disabled={!dirty || saving} onClick={save}>
          {saving ? '…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

function SpecialistView({ data, token }) {
  const tabs = ['Proposals', 'Pipeline']
  const [tab, setTab] = useState(tabs[0])
  const [proposals, setProposals] = useState(data.proposals)
  const k = data.kpis

  function onSaved(updated) {
    setProposals((ps) => ps.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
  }

  const open = proposals.filter((p) => ['New', 'In progress', 'Proposed'].includes(p.status))

  return (
    <>
      <div className="kpi-row">
        <Kpi label="Open proposals" value={k.open_proposals} />
        <Kpi label="Pipeline (mUSD)" value={k.pipeline_musd} />
        <Kpi label="Won" value={k.won} />
        <Kpi label="Clients covered" value={k.clients_covered} />
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Proposals' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Segment</th><th>Product idea</th><th>Rationale</th>
              <th>Status</th><th>Exp. volume (mUSD)</th><th>Comment</th><th></th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <ProposalRow key={p.id} p={p} statuses={data.statuses} token={token} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Pipeline' && (
        <table className="data-table">
          <thead>
            <tr><th>Status</th><th>Proposals</th><th>Volume (mUSD)</th></tr>
          </thead>
          <tbody>
            {data.statuses.map((s) => {
              const rows = proposals.filter((p) => p.status === s)
              return (
                <tr key={s}>
                  <td>{s}</td>
                  <td className="num">{rows.length}</td>
                  <td className="num">{rows.reduce((sum, p) => sum + Number(p.expected_volume_musd), 0).toFixed(1)}</td>
                </tr>
              )
            })}
            <tr className="total-row">
              <td>Open total</td>
              <td className="num">{open.length}</td>
              <td className="num">{open.reduce((s, p) => s + Number(p.expected_volume_musd), 0).toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  )
}

/* ---------------- Management ---------------- */

function ManagementView({ data }) {
  const tabs = ['Summary', 'By Advisor', 'By Segment']
  const [tab, setTab] = useState(tabs[0])
  const k = data.kpis

  return (
    <>
      <div className="kpi-row">
        <Kpi label="Total clients" value={k.total_clients} />
        <Kpi label="Invested assets (mUSD)" value={k.invested_assets_musd} />
        <Kpi label="Revenue YTD (kUSD)" value={k.revenue_ytd_kusd} />
        <Kpi label="NNM YTD (mUSD)" value={k.nnm_ytd_musd} />
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Summary' && (
        <div className="kpi-row">
          <Kpi label="Reviews pending" value={k.reviews_pending} />
          <Kpi label="Open proposals" value={k.open_proposals} />
          <Kpi label="Sales pipeline (mUSD)" value={k.pipeline_musd} />
          <Kpi label="Proposals won" value={k.won_proposals} />
        </div>
      )}

      {tab === 'By Advisor' && (
        <table className="data-table">
          <thead>
            <tr><th>Advisor</th><th>ID</th><th>Clients</th><th>Invested assets (mUSD)</th><th>Revenue YTD (kUSD)</th><th>NNM YTD (mUSD)</th><th>Reviews pending</th></tr>
          </thead>
          <tbody>
            {data.advisors.map((a) => (
              <tr key={a.advisor_id}>
                <td>{a.advisor_name}</td><td>{a.advisor_id}</td>
                <td className="num">{a.clients}</td>
                <td className="num">{a.invested_assets_musd.toFixed(1)}</td>
                <td className="num">{a.revenue_ytd_kusd}</td>
                <td className={`num ${a.nnm_ytd_musd < 0 ? 'neg' : 'pos'}`}>{a.nnm_ytd_musd.toFixed(1)}</td>
                <td className="num">{a.reviews_pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'By Segment' && (
        <table className="data-table">
          <thead>
            <tr><th>Segment</th><th>Clients</th><th>Invested assets (mUSD)</th><th>Revenue YTD (kUSD)</th></tr>
          </thead>
          <tbody>
            {data.segments.map((s) => (
              <tr key={s.segment}>
                <td>{s.segment}</td>
                <td className="num">{s.clients}</td>
                <td className="num">{s.invested_assets_musd.toFixed(1)}</td>
                <td className="num">{s.revenue_ytd_kusd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default function Dashboard({ data, token }) {
  return (
    <main className="content">
      {data.role === 'Client Advisor' && <AdvisorView data={data} />}
      {data.role === 'Management' && <ManagementView data={data} />}
      {data.role === 'Specialist' && <SpecialistView data={data} token={token} />}
    </main>
  )
}
