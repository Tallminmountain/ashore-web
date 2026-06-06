<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore, useStudyLog, usePomodoro, useExamPlan, useIeltsPlan, today } from '../composables/useStore.js'
import { fetchAllData } from '../composables/useStore.js'

const router = useRouter()
const { tasks, getTasksByDate, toggleTask } = useTaskStore()
const { getTotalSecondsByDate, getStreakDays, getWeeklyLogs } = useStudyLog()
const { getTodayCount } = usePomodoro()
const { getDaysUntilExam } = useExamPlan()

// 每分钟刷新一次，确保跨日数据自动更新
const now = ref(Date.now())
const minuteTimer = setInterval(() => { now.value = Date.now() }, 60000)
onUnmounted(() => clearInterval(minuteTimer))
const { ieltsPlan } = useIeltsPlan()

const todayStr = computed(() => { now.value; return today() })
const todayTasks = computed(() => getTasksByDate(todayStr.value))
const completedCount = computed(() => todayTasks.value.filter(t => t.completed).length)
const totalCount = computed(() => todayTasks.value.length)
const completionRate = computed(() => totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100))

const todaySeconds = computed(() => getTotalSecondsByDate(todayStr.value))
const todayHours = computed(() => (todaySeconds.value / 3600).toFixed(1))
const todayMinutes = computed(() => Math.floor(todaySeconds.value / 60))

const streak = computed(() => getStreakDays())
const pomodoroCount = computed(() => getTodayCount())
const daysUntilExam = computed(() => { now.value; return getDaysUntilExam() })

const weeklyData = computed(() => getWeeklyLogs())
const weeklyTotal = computed(() => weeklyData.value.reduce((sum, d) => sum + d.seconds, 0))
const weeklyAvg = computed(() => Math.round(weeklyTotal.value / 7))

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const categoryTagClass = {
  math: 'tag-math',
  english: 'tag-english',
  politics: 'tag-politics',
  major: 'tag-major',
  listening: 'tag-listening',
  reading: 'tag-reading',
  writing: 'tag-writing',
  speaking: 'tag-speaking',
  pomodoro: 'tag-general',
  general: 'tag-general',
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息 🌙'
  if (hour < 9) return '早上好，新的一天加油 ☀️'
  if (hour < 12) return '上午好，专注学习 📚'
  if (hour < 14) return '中午好，记得午休 🍚'
  if (hour < 18) return '下午好，继续努力 💪'
  if (hour < 22) return '晚上好，今日复盘 🌆'
  return '夜深了，早点休息 🌙'
})
</script>

<template>
  <div class="fade-in">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ greeting }}</h1>
        <p class="page-subtitle">今天是 {{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>
      <button class="btn btn-primary" @click="router.push('/tasks')">+ 添加任务</button>
    </div>

    <!-- Stat Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <!-- 今日学习时长 -->
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">今日学习</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-primary);">{{ todayMinutes }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">分钟</div>
      </div>

      <!-- 考研倒计时 -->
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">考研倒计时</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-danger);">{{ daysUntilExam }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">天</div>
      </div>

      <!-- 雅思目标 -->
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">雅思目标</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-accent);">{{ ieltsPlan.targetScore }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">分</div>
      </div>

      <!-- 连续打卡 -->
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">连续打卡</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-success);">{{ streak }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">天</div>
      </div>

      <!-- 番茄钟 -->
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">今日番茄</div>
        <div style="font-size: 28px; font-weight: 700; color: #f97316;">{{ pomodoroCount }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">个</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <!-- 今日待办 -->
      <div class="card" style="grid-column: span 2;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="font-size: 15px; font-weight: 600;">📋 今日待办</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--color-text-secondary);">{{ completedCount }}/{{ totalCount }}</span>
            <div class="progress-bar" style="width: 80px;">
              <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
            </div>
          </div>
        </div>

        <div v-if="todayTasks.length === 0" class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">今天还没有安排任务，去添加吧</div>
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 8px;">
          <div
            v-for="task in todayTasks.slice(0, 8)"
            :key="task.id"
            @click="toggleTask(task.id)"
            style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s;"
            :style="{ background: task.completed ? '#f8fafc' : '#fff', opacity: task.completed ? 0.6 : 1 }"
          >
            <div class="custom-checkbox" :class="{ checked: task.completed }">
              <svg v-if="task.completed" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span :style="{ textDecoration: task.completed ? 'line-through' : 'none', flex: 1, fontSize: '13px' }">{{ task.title }}</span>
            <span class="tag" :class="categoryTagClass[task.category] || 'tag-general'">{{ task.category }}</span>
          </div>
          <div v-if="todayTasks.length > 8" style="text-align: center; padding: 8px; font-size: 12px; color: var(--color-text-secondary);">
            还有 {{ todayTasks.length - 8 }} 项任务...
          </div>
        </div>
      </div>

      <!-- 本周学习趋势 -->
      <div class="card" style="grid-column: span 2;">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px;">📊 本周学习趋势</h3>
        <div style="display: flex; align-items: flex-end; gap: 8px; height: 120px; padding: 0 8px;">
          <div v-for="day in weeklyData" :key="day.date" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div style="font-size: 10px; color: var(--color-text-secondary);">{{ formatTime(day.seconds) }}</div>
            <div
              style="width: 100%; border-radius: 4px 4px 0 0; transition: height 0.5s ease; min-height: 2px;"
              :style="{
                height: Math.max(2, (day.seconds / Math.max(...weeklyData.map(d => d.seconds), 1)) * 80) + 'px',
                background: day.date === todayStr
                  ? 'linear-gradient(180deg, var(--color-primary), var(--color-primary-light))'
                  : 'linear-gradient(180deg, #cbd5e1, #e2e8f0)',
              }"
            ></div>
            <div style="font-size: 10px; color: var(--color-text-secondary);">
              {{ new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' }) }}
            </div>
          </div>
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: center; gap: 24px; font-size: 12px; color: var(--color-text-secondary);">
          <span>本周总计: <strong style="color: var(--color-text);">{{ formatTime(weeklyTotal) }}</strong></span>
          <span>日均: <strong style="color: var(--color-text);">{{ formatTime(weeklyAvg) }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>
