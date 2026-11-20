import type { UnitStatus } from './types'

export { statuses, workshops } from './types'

export function formatDate(date?: string): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`))
}

export function formatCapacity(value: number): string {
  return new Intl.NumberFormat('uk-UA').format(value)
}

export function statusClass(status: UnitStatus): string {
  if (status === 'В експлуатації') return 'status-ok'
  if (status === 'Потребує ТО') return 'status-warning'
  if (status === 'Аварійна зупинка') return 'status-danger'
  return 'status-muted'
}

export function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Сталася невідома помилка'
}
