<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Activity, ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, CheckCircle2,
  CircleAlert, Clock3, Plus, Search, SlidersHorizontal, Wind, X
} from '@lucide/vue'
import { api } from '../api'
import { formatCapacity, formatDate, statusClass, statuses, workshops } from '../utils'

const route = useRoute()
const router = useRouter()
const units = ref([])
const loading = ref(true)
const error = ref('')
const defaultSort = () => localStorage.getItem('defaultUnitSort') || 'capacity-desc'
const query = ref(String(route.query.search ?? ''))
const workshop = ref(String(route.query.workshop ?? ''))
const status = ref(String(route.query.status ?? ''))
const sort = ref(String(route.query.sort ?? defaultSort()))
const currentYear = new Date().getFullYear()
const currentDate = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' })
  .format(new Date()).toLocaleUpperCase('uk')

async function loadUnits() {
  loading.value = true
  error.value = ''
  try {
    units.value = await api.getUnits()
  } catch (cause) {
    error.value = cause.message
  } finally {
    loading.value = false
  }
}

let syncTimer
function syncUrl() {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const nextQuery = {}
    if (query.value.trim()) nextQuery.search = query.value.trim()
    if (workshop.value) nextQuery.workshop = workshop.value
    if (status.value) nextQuery.status = status.value
    if (sort.value !== defaultSort()) nextQuery.sort = sort.value
    router.replace({ name: 'units', query: nextQuery })
  }, 140)
}

watch([query, workshop, status, sort], syncUrl)
watch(() => route.query, (params) => {
  query.value = String(params.search ?? '')
  workshop.value = String(params.workshop ?? '')
  status.value = String(params.status ?? '')
  sort.value = String(params.sort ?? defaultSort())
})
onMounted(loadUnits)

const visibleUnits = computed(() => {
  const search = query.value.trim().toLocaleLowerCase('uk')
  return [...units.value]
    .filter((unit) => !search || `${unit.name} ${unit.serialNumber}`.toLocaleLowerCase('uk').includes(search))
    .filter((unit) => !workshop.value || unit.workshop === workshop.value)
    .filter((unit) => !status.value || unit.status === status.value)
    .sort((a, b) => {
      if (sort.value === 'capacity-asc') return a.airFlowCapacity - b.airFlowCapacity
      if (sort.value === 'date-desc') return b.installationDate.localeCompare(a.installationDate)
      if (sort.value === 'date-asc') return a.installationDate.localeCompare(b.installationDate)
      return b.airFlowCapacity - a.airFlowCapacity
    })
})

const activeCount = computed(() => units.value.filter((unit) => unit.status === statuses[0]).length)
const serviceCount = computed(() => units.value.filter((unit) => unit.status === statuses[1]).length)
const emergencyCount = computed(() => units.value.filter((unit) => unit.status === statuses[2]).length)
const maxCapacity = computed(() => Math.max(...units.value.map((unit) => unit.airFlowCapacity), 1))

function toggleSort() {
  sort.value = sort.value === 'capacity-desc' ? 'capacity-asc' : 'capacity-desc'
}
function clearFilters() {
  query.value = ''
  workshop.value = ''
  status.value = ''
}
async function deleteUnit(unit) {
  if (!window.confirm(`Видалити «${unit.name}» та всі записи його обслуговування?`)) return
  try {
    await api.deleteUnit(unit.id)
    units.value = units.value.filter((item) => item.id !== unit.id)
  } catch (cause) {
    error.value = cause.message
  }
}
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> ІНЖЕНЕРНА СЛУЖБА <span class="eyebrow-date">· {{ currentDate }}</span></div>
        <h1>Реєстр установок</h1>
        <p>Контролюйте стан обладнання та плануйте сервісне обслуговування.</p>
      </div>
      <RouterLink class="button button-primary" to="/units/new"><Plus :size="18" /> Додати установку</RouterLink>
    </div>

    <div class="stat-grid">
      <article class="stat-card">
        <div class="stat-top"><span>Всього установок</span><span class="stat-icon blue"><Wind :size="17" /></span></div>
        <div class="stat-value">{{ units.length }}<span class="stat-unit">од.</span></div>
        <div class="stat-foot"><span class="stat-foot-dot blue-dot"></span> В усіх виробничих цехах</div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span>В експлуатації</span><span class="stat-icon green"><CheckCircle2 :size="17" /></span></div>
        <div class="stat-value">{{ activeCount }}<span class="stat-unit">од.</span></div>
        <div class="stat-foot"><span class="stat-foot-dot green-dot"></span> Працюють у штатному режимі</div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span>Потребують ТО</span><span class="stat-icon amber"><Clock3 :size="17" /></span></div>
        <div class="stat-value">{{ serviceCount }}<span class="stat-unit">од.</span></div>
        <div class="stat-foot"><span class="stat-foot-dot amber-dot"></span> Заплануйте сервісний огляд</div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span>Аварійні зупинки</span><span class="stat-icon red"><CircleAlert :size="17" /></span></div>
        <div class="stat-value">{{ emergencyCount }}<span class="stat-unit">од.</span></div>
        <div class="stat-foot"><span class="stat-foot-dot red-dot"></span> Потребують уваги інженера</div>
      </article>
    </div>

    <section class="equipment-panel">
      <div class="panel-heading">
        <div><h2>Обладнання</h2><p>Перелік вентиляційних та аспіраційних систем</p></div>
        <span class="records-count">{{ visibleUnits.length }} <span>з {{ units.length }} установок</span></span>
      </div>
      <div class="filter-bar">
        <label class="search-field"><Search :size="17" /><input v-model="query" placeholder="Пошук за назвою або номером..." /><button v-if="query" aria-label="Очистити пошук" @click="query = ''"><X :size="15" /></button><kbd>⌘ K</kbd></label>
        <label class="select-filter"><SlidersHorizontal :size="16" /><select v-model="workshop"><option value="">Усі цехи</option><option v-for="item in workshops" :key="item">{{ item }}</option></select></label>
        <label class="select-filter status-filter"><span class="filter-dot"></span><select v-model="status"><option value="">Усі статуси</option><option v-for="item in statuses" :key="item">{{ item }}</option></select></label>
        <button class="sort-button" @click="toggleSort"><ArrowDownUp :size="16" /><span>Продуктивність</span><ArrowDown v-if="sort === 'capacity-desc'" :size="14" /><ArrowUp v-else :size="14" /></button>
      </div>

      <div v-if="error" class="error-banner"><CircleAlert :size="18" /><span>{{ error }}</span><button aria-label="Закрити" @click="error = ''"><X :size="16" /></button></div>
      <div v-if="loading" class="loading-state"><div v-for="n in 3" :key="n" class="skeleton-row"><span></span><i></i><i></i></div></div>
      <div v-else-if="visibleUnits.length" class="unit-list">
        <article v-for="(unit, index) in visibleUnits" :key="unit.id" class="unit-card">
          <div class="unit-symbol"><Wind :size="21" /></div>
          <div class="unit-main">
            <RouterLink class="unit-name" :to="`/units/${unit.id}`">{{ unit.name }}<ArrowRight :size="15" /></RouterLink>
            <div class="unit-subline"><span class="serial-number">{{ unit.serialNumber }}</span><span class="sub-separator">·</span><span>{{ unit.workshop }}</span></div>
          </div>
          <div class="unit-capacity"><span>ПРОДУКТИВНІСТЬ</span><strong>{{ formatCapacity(unit.airFlowCapacity) }} <small>м³/год</small></strong><div class="capacity-track"><i :style="{ width: `${Math.max(8, unit.airFlowCapacity / maxCapacity * 100)}%` }"></i></div></div>
          <div class="unit-installed"><span>ВВЕДЕНО В ЕКСПЛУАТАЦІЮ</span><strong>{{ formatDate(unit.installationDate) }}</strong></div>
          <div class="unit-status"><span :class="['status-badge', statusClass(unit.status)]"><i></i>{{ unit.status }}</span><span class="updated-label"><Activity :size="12" /> {{ index % 2 ? 'Оновлено сьогодні' : 'Оновлено 2 дні тому' }}</span></div>
          <div class="unit-actions"><RouterLink :to="`/units/${unit.id}`" :aria-label="`Відкрити ${unit.name}`"><ArrowRight :size="17" /></RouterLink><button :aria-label="`Видалити ${unit.name}`" @click="deleteUnit(unit)"><X :size="16" /></button></div>
        </article>
      </div>
      <div v-else class="empty-state"><div class="empty-icon"><Wind :size="25" /></div><h3>Установок не знайдено</h3><p>Спробуйте змінити фільтри або додайте нову установку.</p><button class="button button-secondary" @click="clearFilters">Скинути фільтри</button></div>

      <div class="panel-footer"><span><i></i> Дані синхронізовано з сервером</span><span>Останнє оновлення: щойно</span></div>
    </section>
    <footer class="page-footer"><span>© {{ currentYear }} ВентСервіс · Інженерна служба</span><span>API підключено <i></i></span></footer>
  </div>
</template>
