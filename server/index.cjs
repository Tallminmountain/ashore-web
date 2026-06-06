const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./db.cjs')

const app = express()
const PORT = 3000
const JWT_SECRET = 'ashore_secret_key_2026'

app.use(cors())
app.use(express.json())

// ===================== Auth 中间件 =====================
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch {
    res.status(401).json({ error: '登录已过期' })
  }
}

// ===================== 注册 =====================
app.post('/api/auth/register', (req, res) => {
  const { email, password, username, nickname } = req.body
  if (!email || !password || !username) {
    return res.status(400).json({ error: '请填写完整信息' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码至少4个字符' })
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) return res.status(400).json({ error: '该邮箱已注册' })

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (email, password, username, nickname) VALUES (?, ?, ?, ?)'
  ).run(email, hash, username.toLowerCase(), nickname || username)

  // 自动创建默认设置
  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(result.lastInsertRowid)

  const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' })
  res.json({
    token,
    user: { id: result.lastInsertRowid, email, username: username.toLowerCase(), nickname: nickname || username }
  })
})

// ===================== 登录 =====================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: '请填写邮箱和密码' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return res.status(400).json({ error: '邮箱或密码错误' })

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: '邮箱或密码错误' })
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username, nickname: user.nickname }
  })
})

// ===================== 获取当前用户 =====================
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, username, nickname FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json(user)
})

// ===================== 任务 CRUD =====================
app.get('/api/tasks', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at').all(req.userId)
  res.json(rows.map(r => ({
    ...r, completed: !!r.completed, date: r.task_date, estimatedMinutes: r.estimated_minutes, actualSeconds: r.actual_seconds
  })))
})

app.post('/api/tasks', auth, (req, res) => {
  const { title, category, subject, estimatedMinutes, date } = req.body
  const result = db.prepare(
    'INSERT INTO tasks (user_id, title, category, subject, estimated_minutes, task_date) VALUES (?,?,?,?,?,?)'
  ).run(req.userId, title, category || 'general', subject || '', estimatedMinutes || 30, date || new Date().toISOString().slice(0, 10))
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ...row, completed: !!row.completed, date: row.task_date, estimatedMinutes: row.estimated_minutes, actualSeconds: row.actual_seconds })
})

app.patch('/api/tasks/:id', auth, (req, res) => {
  const { completed, actual_seconds } = req.body
  const updates = []
  const values = []
  if (completed !== undefined) { updates.push('completed = ?'); values.push(completed ? 1 : 0) }
  if (actual_seconds !== undefined) { updates.push('actual_seconds = ?'); values.push(actual_seconds) }
  if (updates.length === 0) return res.json({ ok: true })
  values.push(req.params.id, req.userId)
  db.prepare(`UPDATE tasks SET ${updates.join(',')} WHERE id = ? AND user_id = ?`).run(...values)
  res.json({ ok: true })
})

app.delete('/api/tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ ok: true })
})

// ===================== 学习日志 =====================
app.get('/api/study-logs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM study_logs WHERE user_id = ? ORDER BY created_at').all(req.userId)
  res.json(rows.map(r => ({ ...r, date: r.log_date, timestamp: new Date(r.created_at).getTime() })))
})

app.post('/api/study-logs', auth, (req, res) => {
  const { category, subject, seconds } = req.body
  const result = db.prepare(
    'INSERT INTO study_logs (user_id, category, subject, seconds) VALUES (?,?,?,?)'
  ).run(req.userId, category || 'general', subject || '', seconds)
  const row = db.prepare('SELECT * FROM study_logs WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ...row, date: row.log_date, timestamp: new Date(row.created_at).getTime() })
})

// ===================== 番茄钟 =====================
app.get('/api/pomodoro-logs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM pomodoro_logs WHERE user_id = ? ORDER BY created_at').all(req.userId)
  res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.log_date, timestamp: new Date(r.created_at).getTime() })))
})

app.post('/api/pomodoro-logs', auth, (req, res) => {
  const { type, duration, completed } = req.body
  const result = db.prepare(
    'INSERT INTO pomodoro_logs (user_id, type, duration, completed) VALUES (?,?,?,?)'
  ).run(req.userId, type, duration, completed ? 1 : 0)
  const row = db.prepare('SELECT * FROM pomodoro_logs WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ...row, completed: !!row.completed, date: row.log_date, timestamp: new Date(row.created_at).getTime() })
})

// ===================== 用户设置 =====================
app.get('/api/settings', auth, (req, res) => {
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId)
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.userId)
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId)
  }
  res.json(settings)
})

app.patch('/api/settings', auth, (req, res) => {
  const fields = ['exam_date', 'ielts_exam_date', 'ielts_target', 'pomodoro_focus', 'pomodoro_break', 'pomodoro_long_break', 'pomodoro_long_break_interval']
  const updates = []
  const values = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      values.push(req.body[f])
    }
  }
  if (updates.length > 0) {
    values.push(req.userId)
    db.prepare(`UPDATE user_settings SET ${updates.join(',')} WHERE user_id = ?`).run(...values)
  }
  res.json({ ok: true })
})

// ===================== 考研计划 =====================
app.get('/api/exam-tasks', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM exam_tasks WHERE user_id = ? ORDER BY created_at').all(req.userId)
  res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })))
})

app.post('/api/exam-tasks', auth, (req, res) => {
  const { subject_id, title, date } = req.body
  const result = db.prepare(
    'INSERT INTO exam_tasks (user_id, subject_id, title, task_date) VALUES (?,?,?,?)'
  ).run(req.userId, subject_id, title, date || new Date().toISOString().slice(0, 10))
  const row = db.prepare('SELECT * FROM exam_tasks WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ...row, completed: !!row.completed, date: row.task_date })
})

app.patch('/api/exam-tasks/:id', auth, (req, res) => {
  if (req.body.completed !== undefined) {
    db.prepare('UPDATE exam_tasks SET completed = ? WHERE id = ? AND user_id = ?')
      .run(req.body.completed ? 1 : 0, req.params.id, req.userId)
  }
  res.json({ ok: true })
})

app.delete('/api/exam-tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM exam_tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ ok: true })
})

// ===================== 雅思计划 =====================
app.get('/api/ielts-tasks', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM ielts_tasks WHERE user_id = ? ORDER BY created_at').all(req.userId)
  res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })))
})

app.post('/api/ielts-tasks', auth, (req, res) => {
  const { skill_id, title, date } = req.body
  const result = db.prepare(
    'INSERT INTO ielts_tasks (user_id, skill_id, title, task_date) VALUES (?,?,?,?)'
  ).run(req.userId, skill_id, title, date || new Date().toISOString().slice(0, 10))
  const row = db.prepare('SELECT * FROM ielts_tasks WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ...row, completed: !!row.completed, date: row.task_date })
})

app.patch('/api/ielts-tasks/:id', auth, (req, res) => {
  if (req.body.completed !== undefined) {
    db.prepare('UPDATE ielts_tasks SET completed = ? WHERE id = ? AND user_id = ?')
      .run(req.body.completed ? 1 : 0, req.params.id, req.userId)
  }
  res.json({ ok: true })
})

app.delete('/api/ielts-tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM ielts_tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ ok: true })
})

// ===================== 批量拉取（登录后一次拉所有数据）=====================
app.get('/api/all', auth, (req, res) => {
  const uid = req.userId
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at').all(uid)
  const studyLogs = db.prepare('SELECT * FROM study_logs WHERE user_id = ? ORDER BY created_at').all(uid)
  const pomodoroLogs = db.prepare('SELECT * FROM pomodoro_logs WHERE user_id = ? ORDER BY created_at').all(uid)
  const examTasks = db.prepare('SELECT * FROM exam_tasks WHERE user_id = ? ORDER BY created_at').all(uid)
  const ieltsTasks = db.prepare('SELECT * FROM ielts_tasks WHERE user_id = ? ORDER BY created_at').all(uid)
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(uid)
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(uid)
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(uid)
  }

  res.json({
    tasks: tasks.map(r => ({ ...r, completed: !!r.completed, date: r.task_date, estimatedMinutes: r.estimated_minutes, actualSeconds: r.actual_seconds })),
    studyLogs: studyLogs.map(r => ({ ...r, date: r.log_date, timestamp: new Date(r.created_at).getTime() })),
    pomodoroLogs: pomodoroLogs.map(r => ({ ...r, completed: !!r.completed, date: r.log_date, timestamp: new Date(r.created_at).getTime() })),
    examTasks: examTasks.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })),
    ieltsTasks: ieltsTasks.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })),
    settings,
  })
})

// ===================== 启动 =====================
app.listen(PORT, () => {
  console.log(`🚀 Ashore 后端已启动: http://localhost:${PORT}`)
})
