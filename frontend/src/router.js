import { createRouter, createWebHistory } from 'vue-router'
import { useFormGuard } from './stores/formGuard'
import UnitsView from './views/UnitsView.vue'
import UnitDetailView from './views/UnitDetailView.vue'
import UnitFormView from './views/UnitFormView.vue'
import NotFoundView from './views/NotFoundView.vue'
import MaintenanceView from './views/MaintenanceView.vue'
import AnalyticsView from './views/AnalyticsView.vue'
import WorkshopsView from './views/WorkshopsView.vue'
import SettingsView from './views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/units' },
    { path: '/units', name: 'units', component: UnitsView },
    { path: '/maintenance', name: 'maintenance', component: MaintenanceView },
    { path: '/analytics', name: 'analytics', component: AnalyticsView },
    { path: '/workshops', name: 'workshops', component: WorkshopsView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/units/new', name: 'unit-new', component: UnitFormView, meta: { form: true } },
    { path: '/units/:id/edit', name: 'unit-edit', component: UnitFormView, meta: { form: true } },
    { path: '/units/:id', name: 'unit-detail', component: UnitDetailView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const { isDirty } = useFormGuard()
  if (isDirty.value && !window.confirm('У вас є незбережені зміни. Вийти зі сторінки?')) {
    return false
  }
})

export default router
