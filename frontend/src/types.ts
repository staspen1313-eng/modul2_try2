export const workshops = [
  'Ливарний цех',
  'Цех гальваніки',
  'Складальний цех',
  'Фарбувальна лінія'
] as const

export const statuses = [
  'В експлуатації',
  'Потребує ТО',
  'Аварійна зупинка',
  'Виведено з експлуатації'
] as const

export type Workshop = typeof workshops[number]
export type UnitStatus = typeof statuses[number]
export type SortMode = 'capacity-desc' | 'capacity-asc' | 'date-desc' | 'date-asc'

export function isSortMode(value: unknown): value is SortMode {
  return value === 'capacity-desc' || value === 'capacity-asc' ||
    value === 'date-desc' || value === 'date-asc'
}

export function parseSortMode(value: unknown, fallback: SortMode): SortMode {
  return isSortMode(value) ? value : fallback
}

export function parseWorkshop(value: unknown): Workshop | '' {
  return workshops.find((workshop) => workshop === value) ?? ''
}

export function parseUnitStatus(value: unknown): UnitStatus | '' {
  return statuses.find((status) => status === value) ?? ''
}

export interface VentilationUnit {
  id: string
  serialNumber: string
  name: string
  workshop: Workshop
  airFlowCapacity: number
  status: UnitStatus
  installationDate: string
  description: string
}

export type UnitInput = Omit<VentilationUnit, 'id'>

export interface MaintenanceRecord {
  id: string
  unitId: string
  serviceDate: string
  technicianName: string
  filterReplaced: boolean
  pressureDropKPa: number
  comment: string
}

export interface UnitDetails extends VentilationUnit {
  maintenance: MaintenanceRecord[]
}

export type MaintenanceInput = Omit<MaintenanceRecord, 'id' | 'unitId'>

export interface ApiHealth {
  status: 'ok'
}

export interface ApiErrorResponse {
  message?: string
  errors?: string[]
}

export interface MaintenanceListItem extends MaintenanceRecord {
  unitName: string
  serialNumber: string
}
