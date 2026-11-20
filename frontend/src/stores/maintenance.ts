import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { MaintenanceListItem } from '../types'
import { useUnitsStore } from './units'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const records = ref<MaintenanceListItem[]>([])
  const loading = ref(false)

  async function fetchRecords(): Promise<MaintenanceListItem[]> {
    const unitsStore = useUnitsStore()
    loading.value = true
    try {
      const units = await unitsStore.fetchUnits()
      const details = await Promise.all(units.map((unit) => api.getUnit(unit.id)))
      records.value = details
        .flatMap((unit) => unit.maintenance.map((record) => ({
          ...record,
          unitName: unit.name,
          serialNumber: unit.serialNumber
        })))
        .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))
      return records.value
    } finally {
      loading.value = false
    }
  }

  return { records, loading, fetchRecords }
})
