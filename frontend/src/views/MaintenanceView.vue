<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowRight, CalendarDays, CheckCircle2, CircleAlert, Gauge, Search, Wrench } from '@lucide/vue'
import { useMaintenanceStore } from '../stores/maintenance'
import { errorMessage, formatDate } from '../utils'

const maintenanceStore = useMaintenanceStore()
const { records, loading } = storeToRefs(maintenanceStore)
const query = ref('')
const error = ref('')

async function loadRecords() {
  error.value = ''
  try {
    await maintenanceStore.fetchRecords()
  } catch (cause) {
    error.value = errorMessage(cause)
  }
}

onMounted(loadRecords)

const visibleRecords = computed(() => {
  const search = query.value.trim().toLocaleLowerCase('uk')
  return records.value.filter((record) =>
    `${record.unitName} ${record.serialNumber} ${record.technicianName} ${record.comment}`
      .toLocaleLowerCase('uk').includes(search)
  )
})
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> СЕРВІСНА СЛУЖБА</div>
        <h1>Обслуговування</h1>
        <p>Журнал регламентних робіт для всіх вентиляційних установок.</p>
      </div>
      <RouterLink class="button button-primary" to="/units"><Wrench :size="16" /> До установок</RouterLink>
    </div>

    <div class="section-summary">
      <div class="section-summary-icon amber"><Wrench :size="19" /></div>
      <div><strong>{{ records.length }} сервісних записів</strong><span>Історія технічних оглядів і заміни фільтрів</span></div>
      <span class="summary-live"><i></i> Дані з сервера</span>
    </div>

    <section class="equipment-panel section-panel">
      <div class="panel-heading">
        <div><h2>Журнал робіт</h2><p>Записи від нових до старих</p></div>
        <span class="records-count">{{ visibleRecords.length }} <span>з {{ records.length }}</span></span>
      </div>
      <label class="section-search"><Search :size="17" /><input v-model="query" placeholder="Пошук за установкою, інженером або записом..." /></label>

      <div v-if="error" class="error-banner"><CircleAlert :size="18" /><span>{{ error }}</span></div>
      <div v-if="loading" class="loading-state"><div v-for="n in 3" :key="n" class="skeleton-row"><span></span><i></i><i></i></div></div>
      <div v-else-if="visibleRecords.length" class="service-record-list">
        <article v-for="record in visibleRecords" :key="record.id" class="service-record">
          <div class="service-record-icon"><CheckCircle2 :size="18" /></div>
          <div class="service-record-main">
            <RouterLink class="service-record-title" :to="`/units/${record.unitId}`">{{ record.filterReplaced ? 'Заміна фільтрів' : 'Технічний огляд' }} <ArrowRight :size="14" /></RouterLink>
            <RouterLink class="service-record-unit" :to="`/units/${record.unitId}`">{{ record.unitName }} <span>· {{ record.serialNumber }}</span></RouterLink>
            <p>{{ record.comment || 'Коментар не доданий.' }}</p>
            <div class="service-record-meta">
              <span><Wrench :size="13" /> {{ record.technicianName }}</span>
              <span><Gauge :size="13" /> ΔP {{ record.pressureDropKPa }} кПа</span>
              <span>{{ record.filterReplaced ? 'Фільтри замінено' : 'Без заміни фільтрів' }}</span>
            </div>
          </div>
          <time class="service-record-date"><CalendarDays :size="14" /> {{ formatDate(record.serviceDate) }}</time>
        </article>
      </div>
      <div v-else-if="!loading" class="empty-state"><div class="empty-icon"><Wrench :size="23" /></div><h3>Записів не знайдено</h3><p>Змініть пошуковий запит або додайте запис у картці установки.</p><RouterLink class="button button-secondary" to="/units">Відкрити установки</RouterLink></div>
      <div class="panel-footer"><span><i></i> Журнал оновлюється з сервера</span><span>{{ visibleRecords.length }} записів</span></div>
    </section>
  </div>
</template>
