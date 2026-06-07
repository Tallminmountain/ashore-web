<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import { fetchAllData } from './composables/useStore.js'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const { currentUser, isLoggedIn, authLoading, logout } = useAuth()

const isAuthPage = computed(() => route.path === '/login')

const navItems = [
  { path: '/', label: '仪表盘', icon: 'dashboard' },
  { path: '/tasks', label: '任务管理', icon: 'tasks' },
  { path: '/pomodoro', label: '番茄钟', icon: 'timer' },
  { path: '/exam', label: '考研计划', icon: 'exam' },
  { path: '/ielts', label: '雅思计划', icon: 'ielts' },
  { path: '/stats', label: '数据统计', icon: 'stats' },
  { path: '/ai', label: 'AI 计划', icon: 'ai' },
  { path: '/settings', label: '设置', icon: 'settings' },
]

const iconMap = {
  dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  tasks: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  timer: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  exam: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  ielts: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
  stats: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
  ai: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
}

const avatarLetter = computed(() => {
  const nick = currentUser.value?.nickname || currentUser.value?.username || '?'
  return nick.charAt(0).toUpperCase()
})

// When user logs in, fetch all data from Supabase
watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await fetchAllData()
  }
}, { immediate: true })

function navigateTo(path) {
  router.push(path)
  sidebarOpen.value = false
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <!-- Loading state while checking session -->
  <div v-if="authLoading" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e1b4b, #312e81);">
    <div style="text-align: center; color: white;">
      <div style="font-size: 36px; margin-bottom: 16px;">A</div>
      <div style="font-size: 14px; opacity: 0.6;">加载中...</div>
    </div>
  </div>

  <!-- Auth page: no sidebar -->
  <router-view v-else-if="isAuthPage" />

  <!-- App layout -->
  <div v-else class="app-layout">
    <!-- Mobile menu button -->
    <button
      class="mobile-menu-btn btn-icon btn-ghost"
      style="position: fixed; top: 12px; left: 12px; z-index: 60;"
      @click="sidebarOpen = !sidebarOpen"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
      </svg>
    </button>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <!-- Logo -->
      <div style="padding: 20px 16px; display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800;">A</div>
        <div>
          <div style="font-size: 16px; font-weight: 700; letter-spacing: -0.02em;">Ashore</div>
          <div style="font-size: 11px; opacity: 0.6;">上岸计划</div>
        </div>
      </div>

      <!-- Nav -->
      <nav style="flex: 1; padding: 8px 8px;">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="navigateTo(item.path)"
          style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 2px; transition: all 0.15s;"
          :style="{
            background: route.path === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: route.path === item.path ? 'white' : 'rgba(255,255,255,0.65)',
          }"
        >
          <span v-html="iconMap[item.icon]"></span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- User Info & Logout -->
      <div style="padding: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #f97316); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0;">
            {{ avatarLetter }}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ currentUser?.nickname || currentUser?.username }}
            </div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.4);">备考中 · 加油上岸</div>
          </div>
          <button
            @click="handleLogout"
            title="退出登录"
            style="background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4); padding: 4px; border-radius: 6px; transition: all 0.15s;"
            onmouseover="this.style.color='rgba(255,255,255,0.8)'; this.style.background='rgba(255,255,255,0.1)'"
            onmouseout="this.style.color='rgba(255,255,255,0.4)'; this.style.background='none'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 45;"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main -->
    <main class="main-content fade-in" :key="route.path">
      <router-view />
    </main>
  </div>
</template>
