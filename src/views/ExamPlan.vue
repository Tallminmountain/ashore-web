<script setup>
import { ref, computed } from 'vue'
import { useExamPlan, today } from '../composables/useStore.js'

const { examPlan, addDailyTask, toggleDailyTask, removeDailyTask, getTasksByDate, getDaysUntilExam } = useExamPlan()

const todayStr = computed(() => today())
const showForm = ref(false)
const activeSubject = ref(null)

const form = ref({
  title: '',
})

const daysLeft = computed(() => getDaysUntilExam())

const subjectEmoji = {
  math: '📐',
  english: '🔤',
  major: '💻',
  politics: '📖',
}

function openAddForm(subjectId) {
  activeSubject.value = subjectId
  form.value.title = ''
  showForm.value = true
}

function handleSubmit() {
  if (!form.value.title.trim() || !activeSubject.value) return
  addDailyTask(activeSubject.value, {
    title: form.value.title.trim(),
    date: todayStr.value,
  })
  form.value.title = ''
  showForm.value = false
}

function getSubjectProgress(subject) {
  const tasks = subject.dailyTasks.filter(t => t.date === todayStr.value)
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
}
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">考研计划 · 11408</h1>
        <p class="page-subtitle">距离考研还有 <strong style="color: var(--color-danger);">{{ daysLeft }}</strong> 天</p>
      </div>
    </div>

    <!-- Countdown Banner -->
    <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 13px; opacity: 0.7;">考研倒计时</div>
        <div style="font-size: 36px; font-weight: 800;">{{ daysLeft }} <span style="font-size: 16px; font-weight: 400;">天</span></div>
        <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">目标日期: {{ examPlan.examDate }}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; opacity: 0.7;">今日进度</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <div v-for="subject in examPlan.subjects" :key="subject.id" style="text-align: center;">
            <div style="font-size: 20px;">{{ subjectEmoji[subject.id] }}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">{{ getSubjectProgress(subject) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subjects Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      <div v-for="subject in examPlan.subjects" :key="subject.id" class="card">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">{{ subjectEmoji[subject.id] }}</span>
            <h3 style="font-size: 15px; font-weight: 600;">{{ subject.name }}</h3>
          </div>
          <button class="btn btn-primary btn-sm" @click="openAddForm(subject.id)">+ 添加</button>
        </div>

        <!-- Progress -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div class="progress-bar" style="flex: 1;">
            <div class="progress-fill" :style="{ width: getSubjectProgress(subject) + '%', background: subject.color }"></div>
          </div>
          <span style="font-size: 12px; color: var(--color-text-secondary);">{{ getSubjectProgress(subject) }}%</span>
        </div>

        <!-- Tasks -->
        <div v-if="subject.dailyTasks.filter(t => t.date === todayStr).length === 0" style="text-align: center; padding: 16px; color: var(--color-text-secondary); font-size: 13px;">
          暂无今日任务
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 6px;">
          <div
            v-for="task in subject.dailyTasks.filter(t => t.date === todayStr)"
            :key="task.id"
            style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; transition: background 0.15s;"
            :style="{ background: task.completed ? '#f8fafc' : 'transparent', opacity: task.completed ? 0.6 : 1 }"
          >
            <div class="custom-checkbox" :class="{ checked: task.completed }" @click="toggleDailyTask(subject.id, task.id)">
              <svg v-if="task.completed" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span :style="{ textDecoration: task.completed ? 'line-through' : 'none', flex: 1, fontSize: '13px' }">{{ task.title }}</span>
            <button class="btn btn-ghost btn-sm" @click="confirm('确定删除?') && removeDailyTask(subject.id, task.id)" style="padding: 2px 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3 class="modal-title">
          添加 {{ examPlan.subjects.find(s => s.id === activeSubject)?.name }} 任务
        </h3>
        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label">任务内容</label>
            <input v-model="form.title" class="input" placeholder="例如：张宇1000题 第3章" autofocus>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
