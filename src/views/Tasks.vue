<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useTaskStore, today } from '../composables/useStore.js'

const { tasks, addTask, removeTask, toggleTask, getTasksByDate, startTimer, stopTimer, activeTimer } = useTaskStore()

const showForm = ref(false)
const filterDate = ref(today())
const filterCategory = ref('all')

const form = ref({
  title: '',
  category: 'general',
  subject: '',
  estimatedMinutes: 30,
})

const categories = [
  { value: 'general', label: '通用' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'politics', label: '政治' },
  { value: 'major', label: '专业课' },
  { value: 'listening', label: '听力' },
  { value: 'reading', label: '阅读' },
  { value: 'writing', label: '写作' },
  { value: 'speaking', label: '口语' },
]

const categoryTagClass = {
  math: 'tag-math',
  english: 'tag-english',
  politics: 'tag-politics',
  major: 'tag-major',
  listening: 'tag-listening',
  reading: 'tag-reading',
  writing: 'tag-writing',
  speaking: 'tag-speaking',
  general: 'tag-general',
}

const filteredTasks = computed(() => {
  let result = getTasksByDate(filterDate.value)
  if (filterCategory.value !== 'all') {
    result = result.filter(t => t.category === filterCategory.value)
  }
  return result
})

const completedCount = computed(() => filteredTasks.value.filter(t => t.completed).length)
const totalCount = computed(() => filteredTasks.value.length)

function handleSubmit() {
  if (!form.value.title.trim()) return
  addTask({
    title: form.value.title.trim(),
    category: form.value.category,
    subject: form.value.subject.trim(),
    estimatedMinutes: Number(form.value.estimatedMinutes),
    date: filterDate.value,
  })
  form.value.title = ''
  form.value.subject = ''
  form.value.estimatedMinutes = 30
  showForm.value = false
}

function formatSeconds(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

// Timer display
const timerElapsed = ref(0)
let timerInterval = null

function handleStartTimer(taskId) {
  if (activeTimer.value && activeTimer.value.taskId === taskId) {
    stopTimer()
    clearInterval(timerInterval)
    timerInterval = null
    timerElapsed.value = 0
  } else {
    if (activeTimer.value) {
      stopTimer()
      clearInterval(timerInterval)
    }
    startTimer(taskId)
    timerElapsed.value = 0
    timerInterval = setInterval(() => {
      if (activeTimer.value) {
        timerElapsed.value = Math.floor((Date.now() - activeTimer.value.startTime) / 1000)
      }
    }, 1000)
  }
}

function isTimerActive(taskId) {
  return activeTimer.value && activeTimer.value.taskId === taskId
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (activeTimer.value) stopTimer()
})

function changeDate(offset) {
  const d = new Date(filterDate.value)
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  filterDate.value = `${y}-${m}-${day}`
}
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">任务管理</h1>
        <p class="page-subtitle">管理你的学习任务，记录每一分进步</p>
      </div>
      <button class="btn btn-primary" @click="showForm = true">+ 添加任务</button>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 4px;">
        <button class="btn btn-ghost btn-sm" @click="changeDate(-1)">‹</button>
        <input type="date" v-model="filterDate" class="input" style="width: 150px; text-align: center;">
        <button class="btn btn-ghost btn-sm" @click="changeDate(1)">›</button>
        <button class="btn btn-secondary btn-sm" @click="filterDate = today()" style="margin-left: 4px;">今天</button>
      </div>
      <select v-model="filterCategory" class="input select" style="width: 120px;">
        <option value="all">全部科目</option>
        <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
      </select>
      <div style="flex: 1;"></div>
      <span style="font-size: 13px; color: var(--color-text-secondary);">
        完成 {{ completedCount }} / {{ totalCount }}
      </span>
    </div>

    <!-- Task List -->
    <div v-if="filteredTasks.length === 0" class="card empty-state">
      <div class="empty-state-icon">📋</div>
      <div class="empty-state-text">还没有任务，点击"添加任务"开始</div>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 8px;">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="card"
        style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; transition: all 0.15s;"
        :style="{ opacity: task.completed ? 0.6 : 1 }"
      >
        <!-- Checkbox -->
        <div class="custom-checkbox" :class="{ checked: task.completed }" @click="toggleTask(task.id)">
          <svg v-if="task.completed" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <!-- Info -->
        <div style="flex: 1; min-width: 0;">
          <div :style="{ textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 500, fontSize: '13px' }">
            {{ task.title }}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span class="tag" :class="categoryTagClass[task.category] || 'tag-general'">
              {{ categories.find(c => c.value === task.category)?.label || task.category }}
            </span>
            <span v-if="task.subject" style="font-size: 11px; color: var(--color-text-secondary);">{{ task.subject }}</span>
            <span style="font-size: 11px; color: var(--color-text-secondary);">
              预计 {{ task.estimatedMinutes }}分钟
            </span>
            <span v-if="task.actualSeconds > 0" style="font-size: 11px; color: var(--color-primary);">
              实际 {{ formatSeconds(task.actualSeconds) }}
            </span>
          </div>
        </div>

        <!-- Timer -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span v-if="isTimerActive(task.id)" style="font-size: 13px; font-weight: 600; color: var(--color-primary); font-variant-numeric: tabular-nums;">
            {{ formatSeconds(timerElapsed) }}
          </span>
          <button
            class="btn btn-sm"
            :class="isTimerActive(task.id) ? 'btn-danger' : 'btn-success'"
            @click="handleStartTimer(task.id)"
          >
            {{ isTimerActive(task.id) ? '⏹ 停止' : '▶ 开始' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="confirm('确定删除?') && removeTask(task.id)" style="color: var(--color-text-secondary);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3 class="modal-title">添加新任务</h3>
        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label">任务名称</label>
            <input v-model="form.title" class="input" placeholder="例如：高数第三章习题" autofocus>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">科目</label>
              <select v-model="form.category" class="input select">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">预计时间（分钟）</label>
              <input v-model.number="form.estimatedMinutes" type="number" class="input" min="1" max="480">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注（可选）</label>
            <input v-model="form.subject" class="input" placeholder="例如：线性代数">
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
            <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
