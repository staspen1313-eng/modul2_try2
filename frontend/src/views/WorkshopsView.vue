<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Building2, CircleAlert, Wind } from '@lucide/vue'
import { api } from '../api'
import { formatCapacity, statuses, workshops } from '../utils'

const units = ref([])
const loading = ref(true)
const error = ref('')

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

onMounted(loadUnits)

const workshopCards = computed(() => workshops.map((workshop, index) => {
  const items = units.value.filter((unit) => unit.workshop === workshop)
  return {
    name: workshop,
    units: items,
    capacity: items.reduce((sum, unit) => sum + unit.airFlowCapacity, 0),
    attention: items.filter((unit) => unit.status === statuses[1] || unit.status === statuses[2]).length,
    index: String(index + 1).padStart(2, '0')
  }
}))
const workshopCount = computed(() => workshopCards.value.filter((item) => item.units.length).length)
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> СТРУКТУРА ПІДПРИЄМСТВА</div>
        <h1>Виробничі цехи</h1>
        <p>Обладнання, закріплене за виробничими зонами підприємства.</p>
      </div>
      <RouterLink class="button button-secondary" to="/units"><Wind :size="16" /> Усі установки</RouterLink>
    </div>

    <div v-if="error" class="error-banner"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <div v-if="loading" class="loading-state"><div v-for="n in 3" :key="n" class="skeleton-row"><span></span><i></i><i></i></div></div>
    <template v-else>
      <div class="section-summary">
        <div class="section-summary-icon blue"><Building2 :size="19" /></div>
        <div><strong>{{ workshopCount }} активних цехи</strong><span>{{ units.length }} установок у реєстрі підприємства</span></div>
        <span class="summary-live"><i></i> Синхронізовано</span>
      </div>
      <div class="workshop-grid">
        <article v-for="item in workshopCards" :key="item.name" class="workshop-card">
          <div class="workshop-card-top"><span class="workshop-index">ЦЕХ {{ item.index }}</span><span class="workshop-icon"><Building2 :size="18" /></span></div>
          <h2>{{ item.name }}</h2>
          <div class="workshop-metrics">
            <div><span>УСТАНОВКИ</span><strong>{{ item.units.length }} <small>од.</small></strong></div>
            <div><span>ПРОДУКТИВНІСТЬ</span><strong>{{ formatCapacity(item.capacity) }} <small>м³/год</small></strong></div>
          </div>
          <div class="workshop-card-footer">
            <span v-if="item.attention" class="workshop-alert"><CircleAlert :size="14" /> {{ item.attention }} потребують уваги</span>
            <span v-else class="workshop-ok"><i></i> Без зауважень</span>
            <RouterLink :to="{ name: 'units', query: { workshop: item.name } }" :aria-label="`Показати обладнання: ${item.name}`"><ArrowRight :size="16" /></RouterLink>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
