import type {
  ApiErrorResponse, ApiHealth, MaintenanceInput, MaintenanceRecord,
  UnitDetails, UnitInput, VentilationUnit
} from './types'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  try {
    response = await fetch(`/api${path}`, { ...options, headers })
  } catch {
    throw new Error('Не вдалося з’єднатися із сервером. Перевірте, чи запущено backend.')
  }

  if (response.status === 204) return undefined as T
  const data: unknown = await response.json()
  if (!response.ok) {
    const payload = data as ApiErrorResponse
    const message = [payload.message, ...(payload.errors ?? [])].filter(Boolean).join('. ')
    throw new Error(message || `Помилка сервера (${response.status})`)
  }
  return data as T
}

export const api = {
  getHealth: (): Promise<ApiHealth> => request('/health'),
  getUnits: (): Promise<VentilationUnit[]> => request('/units'),
  getUnit: (id: string): Promise<UnitDetails> => request(`/units/${encodeURIComponent(id)}`),
  createUnit: (unit: UnitInput): Promise<VentilationUnit> => request('/units', {
    method: 'POST',
    body: JSON.stringify(unit)
  }),
  updateUnit: (id: string, unit: Partial<UnitInput>): Promise<VentilationUnit> => request(`/units/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(unit)
  }),
  deleteUnit: (id: string): Promise<void> => request(`/units/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addMaintenance: (id: string, record: MaintenanceInput): Promise<MaintenanceRecord> => request(`/units/${encodeURIComponent(id)}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(record)
  })
}
