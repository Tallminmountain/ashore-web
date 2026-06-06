<script setup>
import { ref, computed } from 'vue'
import { useExamPlan, useIeltsPlan, updateExamSettings, today } from '../composables/useStore.js'
import { useAuth } from '../composables/useAuth.js'

const { examPlan, getDaysUntilExam } = useExamPlan()
const { ieltsPlan } = useIeltsPlan()
const { currentUser, updateNickname } = useAuth()

const saved = ref(false)

// 表单数据
const form = ref({
  examDate: examPlan.value.examDate,
  ieltsExamDate: ieltsPlan.value.examDate,
  ieltsTarget: ieltsPlan.value.targetScore,
  nickname: currentUser.value?.nickname || '',
})

const daysUntilExam = computed(() => getDaysUntilExam())
const daysUntilIelts = computed(() => {
  const exam = new Date(ieltsPlan.value.examDate)
  return Math.max(0, Math.ceil((exam - new Date()) / (1000 * 60 * 60 * 24)))
})

async function handleSave() {
  await updateExamSettings({
    examDate: form.value.examDate,
    ieltsExamDate: form.value.ieltsExamDate,
    ieltsTarget: Number(form.value.ieltsTarget),
  })
  if (form.value.nickname.trim()) {
    await updateNickname(form.value.nickname.trim())
  }
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<template>
  <div class="fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-subtitle">管理你的个人信息和考试目标</p>
      </div>
      <button class="btn btn-primary" @click="handleSave">💾 保存设置</button>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="saved" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      设置已保存
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- 个人信息 -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          👤 个人信息
        </h3>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">邮箱</label>
          <input :value="currentUser?.email" class="input" disabled style="padding: 10px; font-size: 13px; background: #f8fafc; color: #94a3b8;">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">用户名</label>
          <input :value="currentUser?.username" class="input" disabled style="padding: 10px; font-size: 13px; background: #f8fafc; color: #94a3b8;">
        </div>
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input v-model="form.nickname" class="input" placeholder="给自己取个名字" style="padding: 10px; font-size: 13px;">
        </div>
      </div>

      <!-- 考研设置 -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          📚 考研设置
        </h3>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">考研日期</label>
          <input v-model="form.examDate" type="date" class="input" style="padding: 10px; font-size: 13px;">
        </div>
        <div style="background: #fef3c7; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">⏰</span>
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #92400e;">距离考研还有</div>
            <div style="font-size: 24px; font-weight: 700; color: #b45309;">{{ daysUntilExam }} 天</div>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--color-text-secondary);">
          <div>考试科目：数学 · 英语 · 专业课 · 政治</div>
          <div style="margin-top: 4px;">目标院校：11408</div>
        </div>
      </div>

      <!-- 雅思设置 -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          🌍 雅思设置
        </h3>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">雅思考试日期</label>
          <input v-model="form.ieltsExamDate" type="date" class="input" style="padding: 10px; font-size: 13px;">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">目标总分</label>
          <select v-model="form.ieltsTarget" class="input select" style="padding: 10px; font-size: 13px;">
            <option :value="5.5">5.5</option>
            <option :value="6.0">6.0</option>
            <option :value="6.5">6.5</option>
            <option :value="7.0">7.0</option>
            <option :value="7.5">7.5</option>
            <option :value="8.0">8.0</option>
            <option :value="8.5">8.5</option>
            <option :value="9.0">9.0</option>
          </select>
        </div>
        <div style="background: #dbeafe; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">🎯</span>
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #1e40af;">目标 {{ ieltsPlan.targetScore }} 分 · 剩余</div>
            <div style="font-size: 24px; font-weight: 700; color: #1d4ed8;">{{ daysUntilIelts }} 天</div>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--color-text-secondary);">
          <div style="display: flex; gap: 16px;">
            <span>听力 {{ ieltsPlan.skills[0].targetScore }}</span>
            <span>阅读 {{ ieltsPlan.skills[1].targetScore }}</span>
            <span>写作 {{ ieltsPlan.skills[2].targetScore }}</span>
            <span>口语 {{ ieltsPlan.skills[3].targetScore }}</span>
          </div>
        </div>
      </div>

      <!-- 数据信息 -->
      <div class="card">
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          💾 数据信息
        </h3>
        <div style="font-size: 13px; color: var(--color-text-secondary); line-height: 2;">
          <div>存储方式：<strong style="color: var(--color-text);">SQLite 本地数据库</strong></div>
          <div>数据库位置：<strong style="color: var(--color-text);">ashore.db</strong></div>
          <div>后端地址：<strong style="color: var(--color-text);">http://localhost:3000</strong></div>
          <div>登录状态：<strong style="color: var(--color-success);">已登录</strong></div>
        </div>
        <div style="margin-top: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: var(--color-text-secondary);">
          💡 数据保存在本地 ashore.db 文件中，重装系统前记得备份
        </div>
      </div>
    </div>
  </div>
</template>
