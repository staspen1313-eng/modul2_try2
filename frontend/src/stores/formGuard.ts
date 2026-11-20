import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFormGuardStore = defineStore('formGuard', () => {
  const isDirty = ref(false)
  return { isDirty }
})
