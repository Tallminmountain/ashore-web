<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useStudyLog, useTaskStore, usePomodoro, today } from '../composables/useStore.js'

Chart.register(...registerables)

const { getWeeklyLogs, getSubjectBreakdown, getStreakDays, getTotalHours, studyLogs } = useStudyLog()
const { tasks } = useTaskStore()
const { getTodayCount } = usePomodoro()

const weeklyChartRef = ref(null)
const subjectChartRef = ref(null)
let weeklyChart = null
let subjectChart = null

const streak = computed(() => getStreakDays())
const totalHours30 = computed(() => getTotalHours(30))
const totalHours7 = computed(() => getTotalHours(7))
const todayCount = computed(() => getTodayCount())

// Weekly chart
const weeklyData = computed(() => getWeeklyLogs())

// Subject breakdown
const subjectData = computed(() => getSubjectBreakdown(7))

const subjectColors = {
  '数学': '#3b82f6',
  '英语': '#10b981',
  '政治': '#ef4444',
  '专业课': '#f59e0b',
  '听力': '#6366f1',
  '阅读': '#14b8a6',
  '写作': '#ec4899',
  '口语': '#f97316',
  '番茄钟': '#f97316',
  '其他': '#94a3b8',
}

function formatSeconds(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function initCharts() {
  // Weekly bar chart
  if (weeklyChartRef.value) {
    if (weeklyChart) weeklyChart.destroy()
    const ctx = weeklyChartRef.value.getContext('2d')
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyData.value.map(d => {
          const date = new Date(d.date)
          return date.toLocaleDateString('zh-CN', { weekday: 'short' })
        }),
        datasets: [{
          label: '学习时长(分钟)',
          data: weeklyData.value.map(d => Math.round(d.seconds / 60)),
          backgroundColor: weeklyData.value.map(d =>
            d.date === today() ? '#6366f1' : '#c7d2fe'
          ),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    })
  }

  // Subject doughnut chart
  if (subjectChartRef.value && Object.keys(subjectData.value).length > 0) {
    if (subjectChart) subjectChart.destroy()
    const ctx2 = subjectChartRef.value.getContext('2d')
    const labels = Object.keys(subjectData.value)
    const data = Object.values(subjectData.value).map(v => Math.round(v / 60))
    const colors = labels.map(l => subjectColors[l] || '#94a3b8')

    subjectChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          spacing: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
          },
        },
      },
    })
  }
}

onMounted(() => {
  setTimeout(initCharts, 100)
})

onUnmounted(() => {
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null }
  if (subjectChart) { subjectChart.destroy(); subjectChart = null }
})

// Task completion stats
const taskStats = computed(() => {
  const allTasks = tasks.value
  const completed = allTasks.filter(t => t.completed).length
  const total = allTasks.length
  return { completed, total, rate: total === 0 ? 0 : Math.round((completed / total) * 100) }
})

// Recent activity (last 7 days)
const recentActivity = computed(() => {
  const logs = studyLogs.value
    .filter(l => {
      const d = new Date(l.date)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      return d >= cutoff
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
  return logs
})
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">用数据见证你的进步</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">连续打卡</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-success);">{{ streak }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">天</div>
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">近7天学习</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-primary);">{{ totalHours7 }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">小时</div>
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">近30天学习</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-primary);">{{ totalHours30 }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">小时</div>
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">任务完成率</div>
        <div style="font-size: 28px; font-weight: 700; color: var(--color-accent);">{{ taskStats.rate }}%</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">{{ taskStats.completed }}/{{ taskStats.total }}</div>
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">今日番茄</div>
        <div style="font-size: 28px; font-weight: 700; color: #f97316;">{{ todayCount }}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">个</div>
      </div>
    </div>

    <!-- Charts -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <!-- Weekly Chart -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px;">📊 本周学习时长</h3>
        <div class="chart-container">
          <canvas ref="weeklyChartRef"></canvas>
        </div>
      </div>

      <!-- Subject Breakdown -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px;">📚 科目时间占比（近7天）</h3>
        <div v-if="Object.keys(subjectData).length === 0" class="empty-state" style="padding: 32px;">
          <div class="empty-state-text">暂无数据</div>
        </div>
        <div v-else class="chart-container">
          <canvas ref="subjectChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px;">📝 最近学习记录</h3>
      <div v-if="recentActivity.length === 0" class="empty-state" style="padding: 24px;">
        <div class="empty-state-text">还没有学习记录，快去开始吧</div>
      </div>
      <div v-else style="display: flex; flex-direction: column; gap: 8px;">
        <div
          v-for="log in recentActivity"
          :key="log.id"
          style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: #f8fafc;"
        >
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="tag tag-general">{{ log.category }}</span>
            <span v-if="log.subject" style="font-size: 13px; color: var(--color-text-secondary);">{{ log.subject }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 13px; font-weight: 500; color: var(--color-primary);">{{ formatSeconds(log.seconds) }}</span>
            <span style="font-size: 11px; color: var(--color-text-secondary);">
              {{ new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
