<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CheckCircle2, CircleAlert, Database, RefreshCw, Save, Server, Settings2 } from '@lucide/vue'
import { useSettingsStore } from '../stores/settings'
import { useSystemStore } from '../stores/system'

const sortOptions = [
  { value: 'capacity-desc', label: 'Продуктивність — від більшої до меншої' },
  { value: 'capacity-asc', label: 'Продуктивність — від меншої до більшої' },
  { value: 'date-desc', label: 'Дата введення — від нових до старих' },
  { value: 'date-asc', label: 'Дата введення — від старих до нових' }
]
const settingsStore = useSettingsStore()
const systemStore = useSystemStore()
const { defaultSort } = storeToRefs(settingsStore)
const { status: connection, error: connectionError } = storeToRefs(systemStore)
const saved = ref(false)

function saveSettings() {
  settingsStore.saveDefaultSort(defaultSort.value)
  saved.value = true
  setTimeout(() => { saved.value = false }, 2500)
}

const checkConnection = systemStore.checkHealth
</script>

<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> КОНФІГУРАЦІЯ ЗАСТОСУНКУ</div>
        <h1>Налаштування</h1>
        <p>Персональні параметри інтерфейсу та стан підключення до сервера.</p>
      </div>
      <button class="button button-secondary" :disabled="connection === 'checking'" @click="checkConnection"><RefreshCw :size="15" /> Перевірити сервер</button>
    </div>

    <section class="equipment-panel settings-panel">
      <div class="settings-section">
        <div class="settings-section-heading"><div class="card-icon"><Settings2 :size="18" /></div><div><h2>Вигляд реєстру</h2><p>Ці параметри зберігаються у вашому браузері.</p></div></div>
        <label class="form-field settings-sort"><span>Сортування за замовчуванням</span><select v-model="defaultSort"><option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select><small>Застосується до реєстру, якщо в URL не вказане інше сортування.</small></label>
        <div class="settings-actions"><span v-if="saved" class="settings-saved"><CheckCircle2 :size="15" /> Налаштування збережено</span><button class="button button-primary" @click="saveSettings"><Save :size="15" /> Зберегти</button></div>
      </div>

      <div class="settings-section">
        <div class="settings-section-heading"><div class="card-icon" :class="{ 'health-error-icon': connection === 'error' }"><Server :size="18" /></div><div><h2>Підключення до сервера</h2><p>Перевірка доступності backend API.</p></div></div>
        <div class="health-row">
          <span :class="['status-badge', connection === 'connected' ? 'status-ok' : connection === 'error' ? 'status-danger' : 'status-muted']"><i></i>{{ connection === 'connected' ? 'Підключено' : connection === 'error' ? 'Немає зв’язку' : 'Перевірка…' }}</span>
          <code>/api/health</code>
          <span class="health-message" v-if="connectionError"><CircleAlert :size="14" /> {{ connectionError }}</span>
        </div>
      </div>

      <div class="settings-section settings-storage">
        <div class="settings-section-heading"><div class="card-icon amber"><Database :size="18" /></div><div><h2>Зберігання даних</h2><p>Локальні JSON-файли на сервері застосунку.</p></div></div>
        <div class="storage-paths"><code>backend/data/units.json</code><code>backend/data/maintenance.json</code></div>
      </div>
    </section>
  </div>
</template>
