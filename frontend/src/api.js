export async function fetchDashboard(role) {
  const res = await fetch(`api/dashboard?role=${encodeURIComponent(role)}`)
  if (!res.ok) throw new Error('Failed to load dashboard')
  return res.json()
}

export async function updateProposal(id, patch) {
  const res = await fetch(`api/proposals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Update failed')
  return res.json()
}
