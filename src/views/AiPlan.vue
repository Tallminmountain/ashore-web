<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useExamPlan, useIeltsPlan, useTaskStore, today } from '../composables/useStore.js'

const { getToken } = useAuth()
const { examPlan, getDaysUntilExam } = useExamPlan()
const { ieltsPlan } = useIeltsPlan()
const { addTask } = useTaskStore()

const API = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'

const loading = ref(false)
const plan = ref(null)
const error = ref('')
const addingAll = ref(false)

const daysUntilExam = computed(() => getDaysUntilExam())
const daysUntilIelts = computed(() => {
  const exam = new Date(ieltsPlan.value.examDate)
  return Math.max(0, Math.ceil((exam - new Date()) / 86400000))
})

const categoryEmoji = {
  math: '📐', english: '🔤', politics: '📖', major: '💻',
  listening: '🎧', reading: '📖', writing: '✍️', speaking: '🗣️',
}

const categoryLabel = {
  math: '数学', english: '英语', politics: '政治', major: '专业课',
  listening: '听力', reading: '阅读', writing: '写作', speaking: '口语',
}

async function generatePlan() {
  loading.value = true
  error.value = ''
  plan.value = null

  try {
    const res = await fetch(`${API}/ai/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '生成失败')
    plan.value = data
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function addAllToTasks() {
  if (!plan.value?.tasks?.length) return
  addingAll.value = true
  for (const t of plan.value.tasks) {
    await addTask({
      title: t.title,
      category: t.category || 'general',
      estimatedMinutes: t.minutes || 30,
      date: today(),
    })
  }
  addingAll.value = false
}

const totalMinutes = computed(() => {
  if (!plan.value?.tasks) return 0
  return plan.value.tasks.reduce((sum, t) => sum + (t.minutes || 0), 0)
})
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 学习计划</h1>
        <p class="page-subtitle">基于你的备考数据，AI 帮你规划今日学习任务</p>
      </div>
      <button class="btn btn-primary" @click="generatePlan" :disabled="loading">
        {{ loading ? '⏳ 生成中...' : '🤖 生成今日计划' }}
      </button>
    </div>

    <!-- 考试信息 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div class="card" style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: white;">
        <div style="font-size: 12px; opacity: 0.7;">考研 11408</div>
        <div style="font-size: 28px; font-weight: 700;">{{ daysUntilExam }} <span style="font-size: 14px;">天</span></div>
        <div style="font-size: 11px; opacity: 0.5;">{{ examPlan.examDate }}</div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #0c4a6e, #075985); color: white;">
        <div style="font-size: 12px; opacity: 0.7;">雅思 · 目标 {{ ieltsPlan.targetScore }}</div>
        <div style="font-size: 28px; font-weight: 700;">{{ daysUntilIelts }} <span style="font-size: 14px;">天</span></div>
        <div style="font-size: 11px; opacity: 0.5;">{{ ieltsPlan.examDate }}</div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="card" style="text-align: center; padding: 48px;">
      <div style="font-size: 36px; margin-bottom: 12px;">🤖</div>
      <div style="font-size: 15px; font-weight: 600; color: var(--color-text);">AI 正在分析你的学习数据...</div>
      <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 8px;">根据你的考试日期、近7天学习时长和任务完成率生成计划</div>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="card" style="background: #fef2f2; border-color: #fecaca;">
      <div style="color: #dc2626; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        {{ error }}
      </div>
    </div>

    <!-- 生成结果 -->
    <div v-if="plan && !loading">
      <!-- 鼓励语 -->
      <div v-if="plan.encouragement" class="card" style="margin-bottom: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); border: none;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 24px;">💬</span>
          <div style="font-size: 14px; color: #92400e; line-height: 1.6;">{{ plan.encouragement }}</div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div v-if="plan.tasks && plan.tasks.length > 0">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 600;">
            📋 今日计划（{{ plan.tasks.length }} 项 · 约 {{ Math.round(totalMinutes / 60) }} 小时）
          </h3>
          <button class="btn btn-success btn-sm" @click="addAllToTasks" :disabled="addingAll">
            {{ addingAll ? '添加中...' : '✅ 全部加入任务' }}
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div
            v-for="(task, i) in plan.tasks"
            :key="i"
            class="card"
            style="display: flex; align-items: center; gap: 12px; padding: 14px 16px;"
          >
            <div style="width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
              {{ categoryEmoji[task.category] || '📝' }}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 500;">{{ task.title }}</div>
              <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;">
                {{ categoryLabel[task.category] || task.category }}
              </div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--color-primary); background: #eef2ff; padding: 4px 10px; border-radius: 6px;">
              {{ task.minutes }} 分钟
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 初始状态 -->
    <div v-if="!plan && !loading && !error" class="card" style="text-align: center; padding: 48px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
      <div style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">AI 智能规划</div>
      <div style="font-size: 13px; color: var(--color-text-secondary); max-width: 360px; margin: 0 auto; line-height: 1.6;">
        基于你的考研/雅思考试日期、近7天学习时长、任务完成率，AI 会为你量身定制今日学习计划
      </div>
      <button class="btn btn-primary btn-lg" style="margin-top: 20px;" @click="generatePlan">
        🤖 生成今日计划
      </button>
    </div>
  </div>
</template>
