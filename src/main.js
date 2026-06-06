import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'

import Auth from './views/Auth.vue'
import Dashboard from './views/Dashboard.vue'
import Tasks from './views/Tasks.vue'
import Pomodoro from './views/Pomodoro.vue'
import ExamPlan from './views/ExamPlan.vue'
import IeltsPlan from './views/IeltsPlan.vue'
import Stats from './views/Stats.vue'
import Settings from './views/Settings.vue'

import { useAuth } from './composables/useAuth.js'

const routes = [
  { path: '/login', name: 'Auth', component: Auth, meta: { guest: true } },
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/tasks', name: 'Tasks', component: Tasks, meta: { requiresAuth: true } },
  { path: '/pomodoro', name: 'Pomodoro', component: Pomodoro, meta: { requiresAuth: true } },
  { path: '/exam', name: 'ExamPlan', component: ExamPlan, meta: { requiresAuth: true } },
  { path: '/ielts', name: 'IeltsPlan', component: IeltsPlan, meta: { requiresAuth: true } },
  { path: '/stats', name: 'Stats', component: Stats, meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// 等待 auth 初始化完成再做路由判断
router.beforeEach(async (to, from, next) => {
  const { isLoggedIn, authLoading } = useAuth()

  // 等 authLoading 结束
  if (authLoading.value) {
    await new Promise(resolve => {
      const unwatch = setInterval(() => {
        if (!authLoading.value) { clearInterval(unwatch); resolve() }
      }, 50)
    })
  }

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    next('/login')
  } else if (to.meta.guest && isLoggedIn.value) {
    next('/')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
