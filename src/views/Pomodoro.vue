<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { usePomodoro } from '../composables/useStore.js'

const { settings, logPomodoro, savePomodoroSettings, getTodayCount } = usePomodoro()

// State
const mode = ref('focus') // 'focus' | 'break' | 'longBreak'
const isRunning = ref(false)
const totalSeconds = computed(() => {
  if (mode.value === 'focus') return settings.value.focusMinutes * 60
  if (mode.value === 'break') return settings.value.breakMinutes * 60
  return settings.value.longBreakMinutes * 60
})
const remaining = ref(totalSeconds.value)
const sessionCount = ref(0)
const startedAt = ref(0)

// Reset remaining when mode changes
watch(totalSeconds, (val) => {
  if (!isRunning.value) remaining.value = val
})

// Timer — 用 wall clock 时间，防止切标签页漂移
let interval = null

function start() {
  if (isRunning.value) return
  startedAt.value = Date.now()
  isRunning.value = true
  interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt.value) / 1000)
    remaining.value = Math.max(0, totalSeconds.value - elapsed)
    if (remaining.value <= 0) {
      complete()
    }
  }, 1000)
}

function pause() {
  isRunning.value = false
  clearInterval(interval)
  interval = null
}

function reset() {
  pause()
  remaining.value = totalSeconds.value
}

function complete(forced = false) {
  pause()
  const elapsed = forced && startedAt.value
    ? Math.round((Date.now() - startedAt.value) / 1000)
    : totalSeconds.value
  logPomodoro(mode.value, elapsed, elapsed >= 60)

  if (mode.value === 'focus') {
    sessionCount.value++
    if (sessionCount.value % settings.value.longBreakInterval === 0) {
      mode.value = 'longBreak'
    } else {
      mode.value = 'break'
    }
  } else {
    mode.value = 'focus'
  }
  remaining.value = totalSeconds.value

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Ashore 番茄钟', {
      body: mode.value === 'focus' ? '休息结束，开始新的专注！' : '专注时间到，休息一下吧！',
    })
  }
}

function skip() {
  complete(true)
}

// Request notification permission
function requestNotification() {
  if ('Notification' in window) {
    Notification.requestPermission()
  }
}

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

// Display
const displayTime = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progress = computed(() => {
  return ((totalSeconds.value - remaining.value) / totalSeconds.value) * 100
})

const circumference = 2 * Math.PI * 130
const dashOffset = computed(() => {
  return circumference - (progress.value / 100) * circumference
})

const modeLabel = computed(() => {
  if (mode.value === 'focus') return '专注中'
  if (mode.value === 'break') return '短休息'
  return '长休息'
})

const modeColor = computed(() => {
  if (mode.value === 'focus') return '#6366f1'
  if (mode.value === 'break') return '#10b981'
  return '#f59e0b'
})

const todayCount = computed(() => getTodayCount())

// Settings form
const showSettings = ref(false)
const editSettings = ref({ ...settings.value })

function saveSettings() {
  savePomodoroSettings({
    focusMinutes: Number(editSettings.value.focusMinutes) || 25,
    breakMinutes: Number(editSettings.value.breakMinutes) || 5,
    longBreakMinutes: Number(editSettings.value.longBreakMinutes) || 15,
    longBreakInterval: Number(editSettings.value.longBreakInterval) || 4,
  })
  showSettings.value = false
  if (!isRunning.value) remaining.value = totalSeconds.value
}
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">番茄钟</h1>
        <p class="page-subtitle">专注学习，高效提升</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary btn-sm" @click="requestNotification">🔔 开启通知</button>
        <button class="btn btn-secondary btn-sm" @click="showSettings = true; editSettings = { ...settings }">⚙ 设置</button>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 24px;">
      <!-- Mode Tabs -->
      <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px;">
        <button
          @click="mode = 'focus'; reset()"
          style="padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s;"
          :style="{ background: mode === 'focus' ? 'white' : 'transparent', color: mode === 'focus' ? '#6366f1' : '#64748b', boxShadow: mode === 'focus' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }"
        >专注</button>
        <button
          @click="mode = 'break'; reset()"
          style="padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s;"
          :style="{ background: mode === 'break' ? 'white' : 'transparent', color: mode === 'break' ? '#10b981' : '#64748b', boxShadow: mode === 'break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }"
        >短休息</button>
        <button
          @click="mode = 'longBreak'; reset()"
          style="padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s;"
          :style="{ background: mode === 'longBreak' ? 'white' : 'transparent', color: mode === 'longBreak' ? '#f59e0b' : '#64748b', boxShadow: mode === 'longBreak' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }"
        >长休息</button>
      </div>

      <!-- Timer Ring -->
      <div class="timer-ring">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle class="track" cx="140" cy="140" r="130" />
          <circle
            class="progress"
            cx="140" cy="140" r="130"
            :stroke="modeColor"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="timer-display">
          <div class="timer-time">{{ displayTime }}</div>
          <div class="timer-label" :style="{ color: modeColor }">{{ modeLabel }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div style="display: flex; gap: 12px;">
        <button v-if="!isRunning" class="btn btn-primary btn-lg" @click="start" style="min-width: 120px;">
          ▶ {{ mode === 'focus' ? '开始专注' : '开始休息' }}
        </button>
        <button v-else class="btn btn-secondary btn-lg" @click="pause" style="min-width: 120px;">
          ⏸ 暂停
        </button>
        <button class="btn btn-secondary btn-lg" @click="reset">↺ 重置</button>
        <button class="btn btn-ghost btn-lg" @click="skip">⏭ 跳过</button>
      </div>

      <!-- Stats -->
      <div style="display: flex; gap: 24px; margin-top: 8px;">
        <div class="card" style="text-align: center; min-width: 120px;">
          <div style="font-size: 24px; font-weight: 700; color: #f97316;">{{ todayCount }}</div>
          <div style="font-size: 12px; color: var(--color-text-secondary);">今日完成</div>
        </div>
        <div class="card" style="text-align: center; min-width: 120px;">
          <div style="font-size: 24px; font-weight: 700; color: var(--color-primary);">{{ sessionCount }}</div>
          <div style="font-size: 12px; color: var(--color-text-secondary);">本轮会话</div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal">
        <h3 class="modal-title">番茄钟设置</h3>
        <form @submit.prevent="saveSettings" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">专注时间（分钟）</label>
              <input v-model.number="editSettings.focusMinutes" type="number" class="input" min="1" max="120">
            </div>
            <div class="form-group">
              <label class="form-label">短休息（分钟）</label>
              <input v-model.number="editSettings.breakMinutes" type="number" class="input" min="1" max="30">
            </div>
            <div class="form-group">
              <label class="form-label">长休息（分钟）</label>
              <input v-model.number="editSettings.longBreakMinutes" type="number" class="input" min="1" max="60">
            </div>
            <div class="form-group">
              <label class="form-label">长休息间隔</label>
              <input v-model.number="editSettings.longBreakInterval" type="number" class="input" min="1" max="10">
            </div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
            <button type="button" class="btn btn-secondary" @click="showSettings = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
