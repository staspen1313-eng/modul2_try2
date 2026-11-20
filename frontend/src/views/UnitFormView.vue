<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CircleAlert, Save, X } from '@lucide/vue'
import { api } from '../api'
import { useFormGuardStore } from '../stores/formGuard'
import { useUnitsStore } from '../stores/units'
import { errorMessage } from '../utils'
import { statuses, workshops, type UnitInput, type UnitStatus, type Workshop } from '../types'

interface UnitForm {
  serialNumber: string
  name: string
  workshop: Workshop | ''
  airFlowCapacity: number | ''
  status: UnitStatus
  installationDate: string
  description: string
}

const route = useRoute()
const router = useRouter()
const formGuard = useFormGuardStore()
const unitsStore = useUnitsStore()
const editing = computed(() => route.name === 'unit-edit')
const unitId = computed(() => route.params.id)
const loading = ref(editing.value)
const saving = ref(false)
const error = ref('')
const form = reactive<UnitForm>({
  serialNumber: '', name: '', workshop: '', airFlowCapacity: '',
  status: 'В експлуатації', installationDate: '', description: ''
})
const baseline = ref('')
const dirty = computed(() => baseline.value !== JSON.stringify(form))
const today = new Date().toISOString().slice(0, 10)

function snapshot() {
  baseline.value = JSON.stringify(form)
}
function syncDirty() {
  formGuard.isDirty = dirty.value
}
watch(dirty, syncDirty)

onMounted(async () => {
  if (!editing.value) {
    snapshot()
    loading.value = false
    return
  }
  try {
    const unit = await api.getUnit(String(unitId.value))
    Object.assign(form, {
      serialNumber: unit.serialNumber,
      name: unit.name,
      workshop: unit.workshop,
      airFlowCapacity: unit.airFlowCapacity,
      status: unit.status,
      installationDate: unit.installationDate,
      description: unit.description ?? ''
    })
    snapshot()
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => { formGuard.isDirty = false })

async function save() {
  saving.value = true
  error.value = ''
  try {
    const workshop = form.workshop
    if (!workshop) throw new Error('Оберіть виробничий цех')
    const payload: UnitInput = {
      ...form,
      workshop,
      airFlowCapacity: Number(form.airFlowCapacity)
    }
    const unit = editing.value
      ? await unitsStore.updateUnit(String(unitId.value), payload)
      : await unitsStore.createUnit(payload)
    formGuard.isDirty = false
    await router.push(`/units/${unit.id}`)
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-content form-page">
    <RouterLink class="back-link" :to="editing ? `/units/${unitId}` : '/units'"><ArrowLeft :size="16" /> Скасувати та повернутися</RouterLink>
    <div class="page-heading form-heading">
      <div><div class="eyebrow"><span class="eyebrow-line"></span> КАРТКА ОБЛАДНАННЯ</div><h1>{{ editing ? 'Редагування установки' : 'Нова установка' }}</h1><p>Заповніть технічні дані для реєстрації обладнання.</p></div>
    </div>

    <div v-if="loading" class="loading-state detail-loading"><div class="skeleton-row"><span></span><i></i></div><div class="skeleton-row"><span></span><i></i></div></div>
    <form v-else class="form-card" @submit.prevent="save">
      <div class="form-section-heading"><div class="card-icon"><span class="form-number">01</span></div><div><h2>Основна інформація</h2><p>Ідентифікація та розміщення установки</p></div></div>
      <div class="form-grid">
        <label class="form-field"><span>Назва установки <b>*</b></span><input v-model.trim="form.name" minlength="3" maxlength="80" placeholder="Наприклад, Витяжна установка ВЦ-12" required /><small>Від 3 до 80 символів</small></label>
        <label class="form-field"><span>Заводський номер <b>*</b></span><input v-model.trim="form.serialNumber" maxlength="40" placeholder="Наприклад, VU-2025-01" required /><small>Унікальний серійний номер обладнання</small></label>
        <label class="form-field"><span>Виробничий цех <b>*</b></span><select v-model="form.workshop" required><option disabled value="">Оберіть цех</option><option v-for="item in workshops" :key="item">{{ item }}</option></select></label>
        <label class="form-field"><span>Робочий стан <b>*</b></span><select v-model="form.status" required><option v-for="item in statuses" :key="item">{{ item }}</option></select></label>
        <label class="form-field"><span>Продуктивність, м³/год <b>*</b></span><input v-model.number="form.airFlowCapacity" type="number" min="500" max="150000" step="1" placeholder="12500" required /><small>Допустимий діапазон: 500–150 000 м³/год</small></label>
        <label class="form-field"><span>Дата введення в експлуатацію <b>*</b></span><input v-model="form.installationDate" type="date" :max="today" required /></label>
        <label class="form-field full-field"><span>Технічні примітки</span><textarea v-model.trim="form.description" maxlength="500" rows="4" placeholder="Додаткова інформація про обладнання, фільтри чи особливості експлуатації"></textarea><small>{{ form.description.length }} / 500 символів</small></label>
      </div>
      <div v-if="error" class="error-banner form-error"><CircleAlert :size="18" /><span>{{ error }}</span><button type="button" @click="error = ''"><X :size="16" /></button></div>
      <div class="form-footer"><span><b>*</b> Обов’язкові поля</span><div class="form-actions"><RouterLink class="button button-secondary" :to="editing ? `/units/${unitId}` : '/units'">Скасувати</RouterLink><button class="button button-primary" :disabled="saving"><Save :size="16" /> {{ saving ? 'Збереження…' : editing ? 'Зберегти зміни' : 'Створити установку' }}</button></div></div>
    </form>
  </div>
</template>
