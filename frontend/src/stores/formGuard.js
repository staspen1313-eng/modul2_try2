import { ref } from 'vue'

const isDirty = ref(false)

export function useFormGuard() {
  return { isDirty }
}
