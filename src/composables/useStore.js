import { ref } from 'vue'
import { useAuth } from './useAuth.js'

const API = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'

function authHeaders() {
  const { getToken } = useAuth()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

// 修复：使用本地日期而非 UTC
export function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ============================================================
//  数据
// ============================================================
const tasks = ref([])
const studyLogs = ref([])
const pomodoroLogs = ref([])
const pomodoroSettings = ref({ focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 })
const examPlan = ref({
  examDate: '2026-12-20',
  subjects: [
    { id: 'math', name: '数学', color: '#3b82f6', dailyTasks: [] },
    { id: 'english', name: '英语', color: '#10b981', dailyTasks: [] },
    { id: 'major', name: '专业课', color: '#f59e0b', dailyTasks: [] },
    { id: 'politics', name: '政治', color: '#ef4444', dailyTasks: [] },
  ],
})
const ieltsPlan = ref({
  targetScore: 7.0,
  examDate: '2026-09-15',
  skills: [
    { id: 'listening', name: '听力', color: '#6366f1', targetScore: 7.0, dailyTasks: [] },
    { id: 'reading', name: '阅读', color: '#10b981', targetScore: 7.0, dailyTasks: [] },
    { id: 'writing', name: '写作', color: '#ec4899', targetScore: 6.5, dailyTasks: [] },
    { id: 'speaking', name: '口语', color: '#f97316', targetScore: 6.5, dailyTasks: [] },
  ],
})
const activeTimer = ref(null)

// ============================================================
//  登录后一次性拉取所有数据
// ============================================================
export async function fetchAllData() {
  try {
    const res = await fetch(`${API}/all`, { headers: authHeaders() })
    if (!res.ok) return
    const data = await res.json()

    tasks.value = data.tasks || []
    studyLogs.value = data.studyLogs || []
    pomodoroLogs.value = data.pomodoroLogs || []

    if (data.settings) {
      pomodoroSettings.value = {
        focusMinutes: data.settings.pomodoro_focus || 25,
        breakMinutes: data.settings.pomodoro_break || 5,
        longBreakMinutes: data.settings.pomodoro_long_break || 15,
        longBreakInterval: data.settings.pomodoro_long_break_interval || 4,
      }
      examPlan.value.examDate = data.settings.exam_date || '2026-12-20'
      ieltsPlan.value.examDate = data.settings.ielts_exam_date || '2026-09-15'
      ieltsPlan.value.targetScore = data.settings.ielts_target || 7.0
    }

    examPlan.value.subjects.forEach(s => { s.dailyTasks = [] })
    ;(data.examTasks || []).forEach(t => {
      const subject = examPlan.value.subjects.find(s => s.id === t.subject_id)
      if (subject) subject.dailyTasks.push({ id: t.id, title: t.title, date: t.date, completed: t.completed })
    })

    ieltsPlan.value.skills.forEach(s => { s.dailyTasks = [] })
    ;(data.ieltsTasks || []).forEach(t => {
      const skill = ieltsPlan.value.skills.find(s => s.id === t.skill_id)
      if (skill) skill.dailyTasks.push({ id: t.id, title: t.title, date: t.date, completed: t.completed })
    })
  } catch (e) {
    console.error('[fetchAllData]', e)
  }
}

// ============================================================
//  更新考试设置
// ============================================================
export async function updateExamSettings({ examDate, ieltsExamDate, ieltsTarget }) {
  const body = {}
  if (examDate !== undefined) {
    examPlan.value.examDate = examDate
    body.exam_date = examDate
  }
  if (ieltsExamDate !== undefined) {
    ieltsPlan.value.examDate = ieltsExamDate
    body.ielts_exam_date = ieltsExamDate
  }
  if (ieltsTarget !== undefined) {
    ieltsPlan.value.targetScore = ieltsTarget
    body.ielts_target = ieltsTarget
  }
  await fetch(`${API}/settings`, {
    method: 'PATCH', headers: authHeaders(),
    body: JSON.stringify(body),
  })
}

// ============================================================
//  Tasks
// ============================================================
export function useTaskStore() {
  async function addTask(task) {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        title: task.title, category: task.category || 'general', subject: task.subject || '',
        estimatedMinutes: task.estimatedMinutes || 30, date: task.date || today(),
      }),
    })
    if (res.ok) {
      const row = await res.json()
      tasks.value.push(row)
    }
  }

  async function removeTask(id) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const backup = tasks.value[idx]
    tasks.value.splice(idx, 1)
    const res = await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) tasks.value.splice(idx, 0, backup)
  }

  async function toggleTask(id) {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return
    const oldVal = task.completed
    task.completed = !oldVal
    const res = await fetch(`${API}/tasks/${id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ completed: !oldVal }),
    })
    if (!res.ok) task.completed = oldVal
  }

  function getTasksByDate(date) {
    return tasks.value.filter(t => t.date === date)
  }

  function startTimer(taskId) {
    stopTimer()
    activeTimer.value = { taskId, startTime: Date.now() }
  }

  async function stopTimer() {
    if (!activeTimer.value) return
    const task = tasks.value.find(t => t.id === activeTimer.value.taskId)
    if (task) {
      const elapsed = Math.floor((Date.now() - activeTimer.value.startTime) / 1000)
      const newSeconds = (task.actualSeconds || 0) + elapsed
      task.actualSeconds = newSeconds
      await fetch(`${API}/tasks/${task.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ actual_seconds: newSeconds }),
      })
      await addStudyLogEntry(task.category, task.subject, elapsed)
    }
    activeTimer.value = null
  }

  return { tasks, activeTimer, addTask, removeTask, toggleTask, getTasksByDate, startTimer, stopTimer }
}

// ============================================================
//  Study Log
// ============================================================
async function addStudyLogEntry(category, subject, seconds) {
  const res = await fetch(`${API}/study-logs`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ category, subject, seconds }),
  })
  if (res.ok) {
    const row = await res.json()
    studyLogs.value.push(row)
  }
}

export function useStudyLog() {
  function getLogsByDate(date) { return studyLogs.value.filter(l => l.date === date) }
  function getTotalSecondsByDate(date) { return getLogsByDate(date).reduce((s, l) => s + l.seconds, 0) }

  function getWeeklyLogs() {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      dates.push(localDateStr(d))
    }
    return dates.map(date => ({ date, seconds: getTotalSecondsByDate(date) }))
  }

  function getSubjectBreakdown(days = 7) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = localDateStr(cutoff)
    const logs = studyLogs.value.filter(l => l.date >= cutoffStr)
    const breakdown = {}
    logs.forEach(l => {
      const key = l.subject || l.category || '其他'
      breakdown[key] = (breakdown[key] || 0) + l.seconds
    })
    return breakdown
  }

  function getStreakDays() {
    let streak = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const dateStr = localDateStr(d)
      if (getTotalSecondsByDate(dateStr) > 0) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }

  function getTotalHours(days = 30) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = localDateStr(cutoff)
    const total = studyLogs.value.filter(l => l.date >= cutoffStr).reduce((s, l) => s + l.seconds, 0)
    return (total / 3600).toFixed(1)
  }

  return { studyLogs, getLogsByDate, getTotalSecondsByDate, getWeeklyLogs, getSubjectBreakdown, getStreakDays, getTotalHours }
}

// ============================================================
//  Pomodoro
// ============================================================
export function usePomodoro() {
  async function logPomodoro(type, duration, completed) {
    const res = await fetch(`${API}/pomodoro-logs`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ type, duration, completed }),
    })
    if (res.ok) {
      const row = await res.json()
      pomodoroLogs.value.push(row)
    }
    if (completed) await addStudyLogEntry('pomodoro', '番茄钟', duration)
  }

  async function savePomodoroSettings(s) {
    pomodoroSettings.value = { ...s }
    await fetch(`${API}/settings`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({
        pomodoro_focus: s.focusMinutes, pomodoro_break: s.breakMinutes,
        pomodoro_long_break: s.longBreakMinutes, pomodoro_long_break_interval: s.longBreakInterval,
      }),
    })
  }

  function getTodayCount() {
    return pomodoroLogs.value.filter(l => l.date === today() && l.type === 'focus' && l.completed).length
  }

  return { settings: pomodoroSettings, pomodoroLogs, logPomodoro, savePomodoroSettings, getTodayCount }
}

// ============================================================
//  考研计划
// ============================================================
export function useExamPlan() {
  async function addDailyTask(subjectId, task) {
    const subject = examPlan.value.subjects.find(s => s.id === subjectId)
    if (!subject) return
    const res = await fetch(`${API}/exam-tasks`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ subject_id: subjectId, title: task.title, date: task.date || today() }),
    })
    if (res.ok) {
      const row = await res.json()
      subject.dailyTasks.push({ id: row.id, title: row.title, date: row.date, completed: row.completed })
    }
  }

  async function toggleDailyTask(subjectId, taskId) {
    const subject = examPlan.value.subjects.find(s => s.id === subjectId)
    if (!subject) return
    const task = subject.dailyTasks.find(t => t.id === taskId)
    if (!task) return
    const oldVal = task.completed
    task.completed = !oldVal
    const res = await fetch(`${API}/exam-tasks/${taskId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ completed: !oldVal }),
    })
    if (!res.ok) task.completed = oldVal
  }

  async function removeDailyTask(subjectId, taskId) {
    const subject = examPlan.value.subjects.find(s => s.id === subjectId)
    if (!subject) return
    const idx = subject.dailyTasks.findIndex(t => t.id === taskId)
    if (idx === -1) return
    const backup = subject.dailyTasks[idx]
    subject.dailyTasks.splice(idx, 1)
    const res = await fetch(`${API}/exam-tasks/${taskId}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) subject.dailyTasks.splice(idx, 0, backup)
  }

  function getTasksByDate(subjectId, date) {
    const subject = examPlan.value.subjects.find(s => s.id === subjectId)
    return subject ? subject.dailyTasks.filter(t => t.date === date) : []
  }

  function getDaysUntilExam() {
    const exam = new Date(examPlan.value.examDate)
    return Math.max(0, Math.ceil((exam - new Date()) / (1000 * 60 * 60 * 24)))
  }

  return { examPlan, addDailyTask, toggleDailyTask, removeDailyTask, getTasksByDate, getDaysUntilExam }
}

// ============================================================
//  雅思计划
// ============================================================
export function useIeltsPlan() {
  async function addDailyTask(skillId, task) {
    const skill = ieltsPlan.value.skills.find(s => s.id === skillId)
    if (!skill) return
    const res = await fetch(`${API}/ielts-tasks`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ skill_id: skillId, title: task.title, date: task.date || today() }),
    })
    if (res.ok) {
      const row = await res.json()
      skill.dailyTasks.push({ id: row.id, title: row.title, date: row.date, completed: row.completed })
    }
  }

  async function toggleDailyTask(skillId, taskId) {
    const skill = ieltsPlan.value.skills.find(s => s.id === skillId)
    if (!skill) return
    const task = skill.dailyTasks.find(t => t.id === taskId)
    if (!task) return
    const oldVal = task.completed
    task.completed = !oldVal
    const res = await fetch(`${API}/ielts-tasks/${taskId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ completed: !oldVal }),
    })
    if (!res.ok) task.completed = oldVal
  }

  async function removeDailyTask(skillId, taskId) {
    const skill = ieltsPlan.value.skills.find(s => s.id === skillId)
    if (!skill) return
    const idx = skill.dailyTasks.findIndex(t => t.id === taskId)
    if (idx === -1) return
    const backup = skill.dailyTasks[idx]
    skill.dailyTasks.splice(idx, 1)
    const res = await fetch(`${API}/ielts-tasks/${taskId}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) skill.dailyTasks.splice(idx, 0, backup)
  }

  function getTasksByDate(skillId, date) {
    const skill = ieltsPlan.value.skills.find(s => s.id === skillId)
    return skill ? skill.dailyTasks.filter(t => t.date === date) : []
  }

  return { ieltsPlan, addDailyTask, toggleDailyTask, removeDailyTask, getTasksByDate }
}
