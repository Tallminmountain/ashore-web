<script setup>
import { ref, computed } from 'vue'
import { useIeltsPlan, today } from '../composables/useStore.js'

const { ieltsPlan, addDailyTask, toggleDailyTask, removeDailyTask, getTasksByDate } = useIeltsPlan()

const todayStr = computed(() => today())
const showForm = ref(false)
const activeSkill = ref(null)

const form = ref({
  title: '',
})

const skillEmoji = {
  listening: '🎧',
  reading: '📖',
  writing: '✍️',
  speaking: '🗣️',
}

const daysUntilExam = computed(() => {
  const exam = new Date(ieltsPlan.value.examDate)
  const now = new Date()
  return Math.max(0, Math.ceil((exam - now) / (1000 * 60 * 60 * 24)))
})

function openAddForm(skillId) {
  activeSkill.value = skillId
  form.value.title = ''
  showForm.value = true
}

function handleSubmit() {
  if (!form.value.title.trim() || !activeSkill.value) return
  addDailyTask(activeSkill.value, {
    title: form.value.title.trim(),
    date: todayStr.value,
  })
  form.value.title = ''
  showForm.value = false
}

function getSkillProgress(skill) {
  const tasks = skill.dailyTasks.filter(t => t.date === todayStr.value)
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
}

function getOverallProgress() {
  const allTasks = ieltsPlan.value.skills.flatMap(s => s.dailyTasks.filter(t => t.date === todayStr.value))
  if (allTasks.length === 0) return 0
  return Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
}
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">雅思计划</h1>
        <p class="page-subtitle">目标分数 <strong style="color: var(--color-accent);">{{ ieltsPlan.targetScore }}</strong> · 距考试 <strong style="color: var(--color-danger);">{{ daysUntilExam }}</strong> 天</p>
      </div>
    </div>

    <!-- Overview Banner -->
    <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #0c4a6e, #075985); color: white;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 13px; opacity: 0.7;">IELTS Overall</div>
          <div style="font-size: 36px; font-weight: 800;">{{ ieltsPlan.targetScore }}</div>
          <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">考试日期: {{ ieltsPlan.examDate }}</div>
        </div>
        <div style="display: flex; gap: 16px;">
          <div v-for="skill in ieltsPlan.skills" :key="skill.id" style="text-align: center;">
            <div style="font-size: 24px;">{{ skillEmoji[skill.id] }}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">{{ skill.name }}</div>
            <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">{{ skill.targetScore }}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; opacity: 0.7;">今日完成率</span>
          <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; border-radius: 3px; background: #fbbf24; transition: width 0.5s;" :style="{ width: getOverallProgress() + '%' }"></div>
          </div>
          <span style="font-size: 12px; font-weight: 600;">{{ getOverallProgress() }}%</span>
        </div>
      </div>
    </div>

    <!-- Skills Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      <div v-for="skill in ieltsPlan.skills" :key="skill.id" class="card">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">{{ skillEmoji[skill.id] }}</span>
            <div>
              <h3 style="font-size: 15px; font-weight: 600;">{{ skill.name }}</h3>
              <span style="font-size: 12px; color: var(--color-text-secondary);">目标 {{ skill.targetScore }}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" @click="openAddForm(skill.id)">+ 添加</button>
        </div>

        <!-- Progress -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div class="progress-bar" style="flex: 1;">
            <div class="progress-fill" :style="{ width: getSkillProgress(skill) + '%', background: skill.color }"></div>
          </div>
          <span style="font-size: 12px; color: var(--color-text-secondary);">{{ getSkillProgress(skill) }}%</span>
        </div>

        <!-- Tasks -->
        <div v-if="skill.dailyTasks.filter(t => t.date === todayStr.value).length === 0" style="text-align: center; padding: 16px; color: var(--color-text-secondary); font-size: 13px;">
          暂无今日练习
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 6px;">
          <div
            v-for="task in skill.dailyTasks.filter(t => t.date === todayStr.value)"
            :key="task.id"
            style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; transition: background 0.15s;"
            :style="{ background: task.completed ? '#f8fafc' : 'transparent', opacity: task.completed ? 0.6 : 1 }"
          >
            <div class="custom-checkbox" :class="{ checked: task.completed }" @click="toggleDailyTask(skill.id, task.id)">
              <svg v-if="task.completed" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span :style="{ textDecoration: task.completed ? 'line-through' : 'none', flex: 1, fontSize: '13px' }">{{ task.title }}</span>
            <button class="btn btn-ghost btn-sm" @click="confirm('确定删除?') && removeDailyTask(skill.id, task.id)" style="padding: 2px 4px;">
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
          添加 {{ ieltsPlan.skills.find(s => s.id === activeSkill)?.name }} 练习
        </h3>
        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label">练习内容</label>
            <input v-model="form.title" class="input" placeholder="例如：剑桥真题 Test 1 Section 2" autofocus>
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
