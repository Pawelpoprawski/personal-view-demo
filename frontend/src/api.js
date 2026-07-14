async function get(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error('Failed to load data')
  return res.json()
}

async function patch(path, body) {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Update failed')
  return res.json()
}

export const fetchHome = () => get('api/home')
export const fetchFinancials = () => get('api/financials')
export const fetchEngagement = () => get('api/engagement')
export const fetchOpportunities = () => get('api/opportunities')
export const fetchClient = (id) => get(`api/clients/${id}`)
export const updateAction = (id, body) => patch(`api/actions/${id}`, body)
export const updateOpportunity = (id, body) => patch(`api/opportunities/${id}`, body)
