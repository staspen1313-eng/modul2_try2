<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Activity, ArrowRight, CircleAlert, Clock3, Wind } from '@lucide/vue'
import BaseSection from '../components/BaseSection.vue'
import { useUnitsStore } from '../stores/units'
import { errorMessage, formatCapacity, statuses, workshops } from '../utils'

const unitsStore = useUnitsStore()
const { units, loading } = storeToRefs(unitsStore)
const error = ref('')

async function loadUnits() {
  error.value = ''
  try {
    await unitsStore.fetchUnits()
  } catch (cause) {
    error.value = errorMessage(cause)
  }
}

onMounted(loadUnits)

const totalCapacity = computed(() => units.value.reduce((sum, unit) => sum + unit.airFlowCapacity, 0))
const statusSummary = computed(() => statuses.map((status) => ({
  status,
  count: units.value.filter((unit) => unit.status === status).length
})))
const workshopSummary = computed(() => workshops.map((workshop) => {
  const items = units.value.filter((unit) => unit.workshop === workshop)
  return {
    workshop,
    count: items.length,
    capacity: items.reduce((sum, unit) => sum + unit.airFlowCapacity, 0),
    attention: items.filter((unit) => unit.status === statuses[1] || unit.status === statuses[2]).length
  }
}))
const maximumWorkshopCapacity = computed(() => Math.max(...workshopSummary.value.map((item) => item.capacity), 1))
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> ОГЛЯД ОБЛАДНАННЯ</div>
        <h1>Аналітика</h1>
        <p>Зведені показники стану вентиляційної мережі підприємства.</p>
      </div>
      <button class="button button-secondary" @click="loadUnits"><Activity :size="16" /> Оновити дані</button>
    </div>

    <div v-if="error" class="error-banner"><CircleAlert :size="18" /><span>{{ error }}</span></div>
    <div v-if="loading" class="loading-state"><div v-for="n in 3" :key="n" class="skeleton-row"><span></span><i></i><i></i></div></div>
    <template v-else>
      <div class="stat-grid analytics-stats">
        <article class="stat-card"><div class="stat-top"><span>Установок у реєстрі</span><span class="stat-icon blue"><Wind :size="17" /></span></div><div class="stat-value">{{ units.length }}<span class="stat-unit">од.</span></div><div class="stat-foot"><span class="stat-foot-dot blue-dot"></span> По всіх виробничих цехах</div></article>
        <article class="stat-card"><div class="stat-top"><span>Сумарна продуктивність</span><span class="stat-icon blue"><Activity :size="17" /></span></div><div class="stat-value analytics-capacity">{{ formatCapacity(totalCapacity) }}<span class="stat-unit">м³/год</span></div><div class="stat-foot"><span class="stat-foot-dot blue-dot"></span> Паспортна потужність мережі</div></article>
        <article class="stat-card"><div class="stat-top"><span>Потребують уваги</span><span class="stat-icon amber"><Clock3 :size="17" /></span></div><div class="stat-value">{{ statusSummary[1].count + statusSummary[2].count }}<span class="stat-unit">од.</span></div><div class="stat-foot"><span class="stat-foot-dot amber-dot"></span> ТО або аварійна зупинка</div></article>
        <article class="stat-card"><div class="stat-top"><span>Працюють штатно</span><span class="stat-icon green"><Activity :size="17" /></span></div><div class="stat-value">{{ statusSummary[0].count }}<span class="stat-unit">од.</span></div><div class="stat-foot"><span class="stat-foot-dot green-dot"></span> В експлуатації</div></article>
      </div>

      <div class="analytics-grid">
        <BaseSection class="analytics-panel">
          <template #header><div><h2>За виробничими цехами</h2><p>Кількість обладнання та його продуктивність</p></div></template>
          <div class="analytics-workshop-list">
            <article v-for="item in workshopSummary" :key="item.workshop" class="analytics-workshop">
              <div class="analytics-workshop-heading"><strong>{{ item.workshop }}</strong><span>{{ item.count }} установок</span></div>
              <div class="analytics-bar"><i :style="{ width: `${item.capacity / maximumWorkshopCapacity * 100}%` }"></i></div>
              <div class="analytics-workshop-meta"><span>{{ formatCapacity(item.capacity) }} м³/год</span><RouterLink :to="{ name: 'units', query: { workshop: item.workshop } }">Відкрити список <ArrowRight :size="13" /></RouterLink></div>
            </article>
          </div>
        </BaseSection>

        <BaseSection class="analytics-panel">
          <template #header><div><h2>Розподіл за станом</h2><p>Поточний статус вентиляційних установок</p></div></template>
          <div class="analytics-status-list">
            <div v-for="(item, index) in statusSummary" :key="item.status" class="analytics-status-row">
              <span :class="['status-badge', index === 0 ? 'status-ok' : index === 1 ? 'status-warning' : index === 2 ? 'status-danger' : 'status-muted']"><i></i>{{ item.status }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
          <RouterLink class="analytics-footer-link" to="/units">Перейти до реєстру <ArrowRight :size="14" /></RouterLink>
        </BaseSection>
      </div>
      <div class="detail-note"><Activity :size="16" /><span>Показники розраховані за актуальними даними реєстру.</span></div>
    </template>
  </div>
</template>
