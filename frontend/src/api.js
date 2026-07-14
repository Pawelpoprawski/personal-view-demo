async function request(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(method === 'GET' ? 'Failed to load data' : 'Update failed')
  return res.json()
}

export const fetchHome = () => request('api/home')
export const fetchFinancials = () => request('api/financials')
export const fetchEngagement = () => request('api/engagement')
export const fetchOpportunities = () => request('api/opportunities')
export const fetchClient = (id) => request(`api/clients/${id}`)
export const search = (q) => request(`api/search?q=${encodeURIComponent(q)}`)

export const createAction = (body) => request('api/actions', 'POST', body)
export const updateAction = (id, body) => request(`api/actions/${id}`, 'PATCH', body)
export const addActionNote = (id, text) => request(`api/actions/${id}/notes`, 'POST', { text })

export const createOpportunity = (body) => request('api/opportunities', 'POST', body)
export const updateOpportunity = (id, body) => request(`api/opportunities/${id}`, 'PATCH', body)

export const createInteraction = (body) => request('api/interactions', 'POST', body)

export const updateClientTags = (id, tags) => request(`api/clients/${id}/tags`, 'PATCH', { tags })
export const addClientNote = (id, text) => request(`api/clients/${id}/notes`, 'POST', { text })

export const talk = (question) => request('api/talk', 'POST', { question })
