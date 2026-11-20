import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { errorMessage } from '../utils'

export const useSystemStore = defineStore('system', () => {
  const status = ref<'checking' | 'connected' | 'error'>('checking')
  const error = ref('')

  async function checkHealth(): Promise<void> {
    status.value = 'checking'
    error.value = ''
    try {
      await api.getHealth()
      status.value = 'connected'
    } catch (cause) {
      status.value = 'error'
      error.value = errorMessage(cause)
    }
  }

  return { status, error, checkHealth }
})
