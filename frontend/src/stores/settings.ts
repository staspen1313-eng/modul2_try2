import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isSortMode, type SortMode } from '../types'

const storageKey = 'defaultUnitSort'

export const useSettingsStore = defineStore('settings', () => {
  const savedSort = localStorage.getItem(storageKey)
  const defaultSort = ref<SortMode>(isSortMode(savedSort) ? savedSort : 'capacity-desc')

  function saveDefaultSort(value: SortMode): void {
    defaultSort.value = value
    localStorage.setItem(storageKey, value)
  }

  return { defaultSort, saveDefaultSort }
})
