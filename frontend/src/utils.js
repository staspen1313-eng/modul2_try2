export const workshops = ['Ливарний цех', 'Цех гальваніки', 'Складальний цех', 'Фарбувальна лінія']
export const statuses = ['В експлуатації', 'Потребує ТО', 'Аварійна зупинка', 'Виведено з експлуатації']

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`))
}

export function formatCapacity(value) {
  return new Intl.NumberFormat('uk-UA').format(value)
}

export function statusClass(status) {
  if (status === 'В експлуатації') return 'status-ok'
  if (status === 'Потребує ТО') return 'status-warning'
  if (status === 'Аварійна зупинка') return 'status-danger'
  return 'status-muted'
}
