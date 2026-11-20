<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, ArrowUpRight, Check, CheckCircle2, CircleAlert,
  ClipboardCheck, Clock3, Gauge, Pencil, Plus, Wind, Wrench, X
} from '@lucide/vue'
import { api } from '../api'
import { errorMessage, formatCapacity, formatDate, statusClass } from '../utils'
import type { MaintenanceInput, UnitDetails } from '../types'

type MaintenanceForm = Omit<MaintenanceInput, 'pressureDropKPa'> & {
  pressureDropKPa: number | ''
}

const route = useRoute()
const unit = ref<UnitDetails | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const showMaintenance = ref(false)
const today = new Date().toISOString().slice(0, 10)
const maintenance = ref<MaintenanceForm>({
  serviceDate: today,
  technicianName: 'Олександр Коваль',
  filterReplaced: false,
  pressureDropKPa: '',
  comment: ''
})

async function loadUnit() {
  loading.value = true
  error.value = ''
  try {
    unit.value = await api.getUnit(String(route.params.id))
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}
onMounted(loadUnit)

async function saveMaintenance() {
  if (!unit.value) return
  saving.value = true
  error.value = ''
  try {
    await api.addMaintenance(unit.value.id, {
      ...maintenance.value,
      pressureDropKPa: Number(maintenance.value.pressureDropKPa)
    })
    showMaintenance.value = false
    maintenance.value = {
      serviceDate: today,
      technicianName: 'Олександр Коваль',
      filterReplaced: false,
      pressureDropKPa: '',
      comment: ''
    }
    await loadUnit()
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <div v-if="loading" class="loading-state detail-loading"><div class="skeleton-row"><span></span><i></i></div><div class="skeleton-row"><span></span><i></i></div></div>
    <template v-else-if="unit">
      <RouterLink class="back-link" to="/units"><ArrowLeft :size="16" /> До реєстру</RouterLink>
      <div class="page-heading detail-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> ПАСПОРТ ОБЛАДНАННЯ <span class="eyebrow-date">· {{ unit.serialNumber }}</span></div>
          <h1>{{ unit.name }}</h1>
          <p>{{ unit.workshop }} <span class="sub-separator">·</span> Введено {{ formatDate(unit.installationDate) }}</p>
        </div>
        <div class="heading-actions"><RouterLink class="button button-secondary" :to="`/units/${unit.id}/edit`"><Pencil :size="16" /> Редагувати</RouterLink><button class="button button-primary" @click="showMaintenance = !showMaintenance"><Plus :size="17" /> Записати ТО</button></div>
      </div>

      <div v-if="error" class="error-banner"><CircleAlert :size="18" /><span>{{ error }}</span><button @click="error = ''"><X :size="16" /></button></div>
      <div class="detail-grid">
        <section class="detail-card passport-card">
          <div class="detail-card-title"><div class="card-icon"><Wind :size="19" /></div><div><h2>Технічні характеристики</h2><p>Основна інформація про обладнання</p></div></div>
          <div class="passport-status"><span :class="['status-badge', statusClass(unit.status)]"><i></i>{{ unit.status }}</span></div>
          <div class="spec-grid">
            <div class="spec-item"><span>ЗАВОДСЬКИЙ НОМЕР</span><strong>{{ unit.serialNumber }}</strong></div>
            <div class="spec-item"><span>ВИРОБНИЧИЙ ЦЕХ</span><strong>{{ unit.workshop }}</strong></div>
            <div class="spec-item"><span>ПРОДУКТИВНІСТЬ</span><strong>{{ formatCapacity(unit.airFlowCapacity) }} <small>м³/год</small></strong></div>
            <div class="spec-item"><span>ДАТА ВВЕДЕННЯ</span><strong>{{ formatDate(unit.installationDate) }}</strong></div>
            <div class="spec-item description-spec"><span>ТЕХНІЧНІ ПРИМІТКИ</span><strong>{{ unit.description || 'Примітки не додані' }}</strong></div>
          </div>
        </section>

        <section class="detail-card service-card">
          <div class="detail-card-title"><div class="card-icon amber"><Wrench :size="18" /></div><div><h2>Обслуговування</h2><p>Журнал технічних робіт</p></div><span class="records-count service-total">{{ unit.maintenance.length }} запис.</span></div>
          <form v-if="showMaintenance" class="maintenance-form" @submit.prevent="saveMaintenance">
            <div class="form-grid compact-grid">
              <label class="form-field"><span>Дата обслуговування</span><input v-model="maintenance.serviceDate" type="date" :max="today" required /></label>
              <label class="form-field"><span>Інженер</span><input v-model.trim="maintenance.technicianName" required /></label>
              <label class="form-field"><span>Перепад тиску, кПа</span><input v-model.number="maintenance.pressureDropKPa" type="number" min="0.01" max="10" step="0.01" required /></label>
              <label class="checkbox-field"><input v-model="maintenance.filterReplaced" type="checkbox" /><span>Фільтри замінено</span></label>
              <label class="form-field full-field"><span>Коментар</span><textarea v-model.trim="maintenance.comment" rows="2" placeholder="Результат технічного огляду"></textarea></label>
            </div>
            <div class="form-actions"><button type="button" class="button button-secondary" @click="showMaintenance = false">Скасувати</button><button class="button button-primary" :disabled="saving"><Check :size="16" /> {{ saving ? 'Збереження…' : 'Зберегти запис' }}</button></div>
          </form>
          <div v-else-if="unit.maintenance.length" class="timeline">
            <article v-for="record in unit.maintenance" :key="record.id" class="timeline-item">
              <span class="timeline-marker"><CheckCircle2 :size="15" /></span>
              <div class="timeline-content">
                <div class="timeline-heading"><strong>{{ record.filterReplaced ? 'Заміна фільтрів' : 'Технічний огляд' }}</strong><time>{{ formatDate(record.serviceDate) }}</time></div>
                <p>{{ record.comment || 'Планове сервісне обслуговування установки.' }}</p>
                <div class="timeline-meta"><span><ClipboardCheck :size="13" /> {{ record.technicianName }}</span><span><Gauge :size="13" /> ΔP {{ record.pressureDropKPa }} кПа</span></div>
              </div>
            </article>
          </div>
          <div v-else class="empty-timeline"><Clock3 :size="20" /><span>Записів про обслуговування поки немає.</span></div>
          <button v-if="!showMaintenance" class="add-service-link" @click="showMaintenance = true"><Plus :size="15" /> Додати запис обслуговування <ArrowUpRight :size="14" /></button>
        </section>
      </div>
      <div class="detail-note"><CheckCircle2 :size="16" /><span>Усі зміни та записи синхронізуються із сервером автоматично.</span></div>
    </template>
    <div v-else class="not-found-panel"><div class="not-found-code">404</div><h2>Установку не знайдено</h2><p>{{ error || 'Можливо, її було видалено або посилання некоректне.' }}</p><RouterLink class="button button-primary" to="/units"><ArrowLeft :size="16" /> Повернутися до реєстру</RouterLink></div>
  </div>
</template>
