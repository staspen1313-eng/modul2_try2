async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    })
  } catch {
    throw new Error('Не вдалося з’єднатися із сервером. Перевірте, чи запущено backend.')
  }

  if (response.status === 204) return null
  const data = await response.json()
  if (!response.ok) {
    const message = [data.message, ...(data.errors ?? [])].filter(Boolean).join('. ')
    throw new Error(message || `Помилка сервера (${response.status})`)
  }
  return data
}

export const api = {
  getHealth: () => request('/health'),
  getUnits: () => request('/units'),
  getUnit: (id) => request(`/units/${encodeURIComponent(id)}`),
  createUnit: (unit) => request('/units', { method: 'POST', body: JSON.stringify(unit) }),
  updateUnit: (id, unit) => request(`/units/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(unit)
  }),
  deleteUnit: (id) => request(`/units/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addMaintenance: (id, record) => request(`/units/${encodeURIComponent(id)}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(record)
  })
}
