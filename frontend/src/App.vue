<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity, AirVent, ArrowUpRight, Bell, Boxes, ChevronDown, CircleHelp,
  ClipboardList, LayoutDashboard, Settings
} from '@lucide/vue'
import { useSystemStore } from './stores/system'

const route = useRoute()
const system = useSystemStore()
let healthTimer: number | undefined
const pageTitle = computed(() => {
  if (route.name === 'unit-detail') return 'Паспорт установки'
  if (route.name === 'unit-new') return 'Нова установка'
  if (route.name === 'unit-edit') return 'Редагування установки'
  if (route.name === 'maintenance') return 'Обслуговування'
  if (route.name === 'analytics') return 'Аналітика'
  if (route.name === 'workshops') return 'Виробничі цехи'
  if (route.name === 'settings') return 'Налаштування'
  return 'Реєстр установок'
})

onMounted(() => {
  void system.checkHealth()
  healthTimer = window.setInterval(system.checkHealth, 30000)
})

onBeforeUnmount(() => {
  if (healthTimer !== undefined) window.clearInterval(healthTimer)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/units" @click.prevent="$router.push('/units')">
        <span class="brand-mark"><AirVent :size="22" /></span>
        <span class="brand-name">вент<span>сервіс</span><small>ENGINEERING SYSTEM</small></span>
      </a>

      <div class="sidebar-caption">РОБОЧИЙ ПРОСТІР</div>
      <nav class="side-nav">
        <RouterLink class="nav-link" to="/units" :class="{ active: route.name !== undefined && ['units', 'unit-detail', 'unit-new', 'unit-edit'].includes(String(route.name)) }">
          <LayoutDashboard :size="18" /><span>Установки</span>
        </RouterLink>
        <RouterLink class="nav-link" to="/maintenance" :class="{ active: route.name === 'maintenance' }">
          <ClipboardList :size="18" /><span>Обслуговування</span>
        </RouterLink>
        <RouterLink class="nav-link" to="/analytics" :class="{ active: route.name === 'analytics' }">
          <Activity :size="18" /><span>Аналітика</span>
        </RouterLink>
      </nav>

      <div class="sidebar-caption section-spacer">СИСТЕМА</div>
      <nav class="side-nav">
        <RouterLink class="nav-link" to="/workshops" :class="{ active: route.name === 'workshops' }"><Boxes :size="18" /><span>Виробничі цехи</span></RouterLink>
        <RouterLink class="nav-link" to="/settings" :class="{ active: route.name === 'settings' }"><Settings :size="18" /><span>Налаштування</span></RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="support-card">
          <div class="support-icon"><CircleHelp :size="18" /></div>
          <div><strong>Потрібна допомога?</strong><span>Зверніться до підтримки</span></div>
          <ArrowUpRight :size="15" class="support-arrow" />
        </div>
        <button class="profile-button">
          <span class="avatar">ПС</span>
          <span class="profile-copy"><strong>Пенюшкевич Станислав</strong><small>Інженер служби</small></span>
          <ChevronDown :size="16" />
        </button>
      </div>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="breadcrumbs"><span>ВентСервіс</span><span class="crumb-slash">/</span><strong>{{ pageTitle }}</strong></div>
        <div class="top-actions">
          <span class="system-status" :class="{ 'system-error': system.status === 'error', 'system-checking': system.status === 'checking' }">
            <i></i>{{ system.status === 'connected' ? 'Система працює' : system.status === 'error' ? 'Немає зв’язку' : 'Перевірка…' }}
          </span>
          <button class="icon-button" aria-label="Сповіщення"><Bell :size="18" /><i class="notification-dot"></i></button>
          <span class="top-avatar">ПС</span>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>
