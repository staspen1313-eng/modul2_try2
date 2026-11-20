import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { UnitInput, VentilationUnit } from '../types'

export const useUnitsStore = defineStore('units', () => {
  const units = ref<VentilationUnit[]>([])
  const loading = ref(false)
  const lastFetchedAt = ref<Date | null>(null)

  async function fetchUnits(): Promise<VentilationUnit[]> {
    loading.value = true
    try {
      units.value = await api.getUnits()
      lastFetchedAt.value = new Date()
      return units.value
    } finally {
      loading.value = false
    }
  }

  async function createUnit(input: UnitInput): Promise<VentilationUnit> {
    const unit = await api.createUnit(input)
    units.value = [...units.value, unit]
    lastFetchedAt.value = new Date()
    return unit
  }

  async function updateUnit(id: string, input: Partial<UnitInput>): Promise<VentilationUnit> {
    const unit = await api.updateUnit(id, input)
    units.value = units.value.map((item) => item.id === id ? unit : item)
    lastFetchedAt.value = new Date()
    return unit
  }

  async function deleteUnit(id: string): Promise<void> {
    await api.deleteUnit(id)
    units.value = units.value.filter((unit) => unit.id !== id)
    lastFetchedAt.value = new Date()
  }

  return { units, loading, lastFetchedAt, fetchUnits, createUnit, updateUnit, deleteUnit }
})
