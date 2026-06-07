const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { db, initDB } = require('./db.cjs')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'ashore_secret_key_2026'

app.use(cors())
app.use(express.json())

// 初始化数据库表
let dbReady = initDB().catch(err => { console.error('DB init error:', err); throw err })

// 等待 DB 就绪中间件
async function ensureDB(req, res, next) {
  await dbReady
  next()
}

// Auth 中间件
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).id
    next()
  } catch { res.status(401).json({ error: '登录已过期' }) }
}

// ===================== 注册 =====================
app.post('/api/auth/register', ensureDB, async (req, res) => {
  try {
    const { email, password, username, nickname } = req.body
    if (!email || !password || !username) return res.status(400).json({ error: '请填写完整信息' })
    if (password.length < 4) return res.status(400).json({ error: '密码至少4个字符' })

    const { rows } = await db.execute('SELECT id FROM users WHERE email = ?', [email])
    if (rows.length > 0) return res.status(400).json({ error: '该邮箱已注册' })

    const hash = bcrypt.hashSync(password, 10)
    const result = await db.execute(
      'INSERT INTO users (email, password, username, nickname) VALUES (?, ?, ?, ?)',
      [email, hash, username.toLowerCase(), nickname || username]
    )
    const userId = Number(result.lastInsertRowid)
    await db.execute('INSERT INTO user_settings (user_id) VALUES (?)', [userId])

    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id: userId, email, username: username.toLowerCase(), nickname: nickname || username } })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 登录 =====================
app.post('/api/auth/login', ensureDB, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: '请填写邮箱和密码' })

    const { rows } = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) return res.status(400).json({ error: '邮箱或密码错误' })

    const user = rows[0]
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: '邮箱或密码错误' })

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, nickname: user.nickname } })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 当前用户 =====================
app.get('/api/auth/me', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT id, email, username, nickname FROM users WHERE id = ?', [req.userId])
    if (rows.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 任务 =====================
app.get('/api/tasks', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at', [req.userId])
    res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date, estimatedMinutes: r.estimated_minutes, actualSeconds: r.actual_seconds })))
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.post('/api/tasks', ensureDB, auth, async (req, res) => {
  try {
    const { title, category, subject, estimatedMinutes, date } = req.body
    if (!title?.trim()) return res.status(400).json({ error: '任务名称不能为空' })
    const result = await db.execute(
      'INSERT INTO tasks (user_id, title, category, subject, estimated_minutes, task_date) VALUES (?,?,?,?,?,?)',
      [req.userId, title, category || 'general', subject || '', estimatedMinutes || 30, date || new Date().toISOString().slice(0, 10)]
    )
    const { rows } = await db.execute('SELECT * FROM tasks WHERE id = ?', [Number(result.lastInsertRowid)])
    const r = rows[0]
    res.json({ ...r, completed: !!r.completed, date: r.task_date, estimatedMinutes: r.estimated_minutes, actualSeconds: r.actual_seconds })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.patch('/api/tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    const { completed, actual_seconds } = req.body
    const updates = [], values = []
    if (completed !== undefined) { updates.push('completed = ?'); values.push(completed ? 1 : 0) }
    if (actual_seconds !== undefined) { updates.push('actual_seconds = ?'); values.push(actual_seconds) }
    if (updates.length === 0) return res.json({ ok: true })
    values.push(req.params.id, req.userId)
    await db.execute(`UPDATE tasks SET ${updates.join(',')} WHERE id = ? AND user_id = ?`, values)
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.delete('/api/tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 学习日志 =====================
app.get('/api/study-logs', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT * FROM study_logs WHERE user_id = ? ORDER BY created_at', [req.userId])
    res.json(rows.map(r => ({ ...r, date: r.log_date, timestamp: new Date(r.created_at).getTime() })))
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.post('/api/study-logs', ensureDB, auth, async (req, res) => {
  try {
    const { category, subject, seconds } = req.body
    const result = await db.execute(
      'INSERT INTO study_logs (user_id, category, subject, seconds) VALUES (?,?,?,?)',
      [req.userId, category || 'general', subject || '', seconds]
    )
    const { rows } = await db.execute('SELECT * FROM study_logs WHERE id = ?', [Number(result.lastInsertRowid)])
    const r = rows[0]
    res.json({ ...r, date: r.log_date, timestamp: new Date(r.created_at).getTime() })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 番茄钟 =====================
app.get('/api/pomodoro-logs', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT * FROM pomodoro_logs WHERE user_id = ? ORDER BY created_at', [req.userId])
    res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.log_date, timestamp: new Date(r.created_at).getTime() })))
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.post('/api/pomodoro-logs', ensureDB, auth, async (req, res) => {
  try {
    const { type, duration, completed } = req.body
    const result = await db.execute(
      'INSERT INTO pomodoro_logs (user_id, type, duration, completed) VALUES (?,?,?,?)',
      [req.userId, type, duration, completed ? 1 : 0]
    )
    const { rows } = await db.execute('SELECT * FROM pomodoro_logs WHERE id = ?', [Number(result.lastInsertRowid)])
    const r = rows[0]
    res.json({ ...r, completed: !!r.completed, date: r.log_date, timestamp: new Date(r.created_at).getTime() })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 用户设置 =====================
app.get('/api/settings', ensureDB, auth, async (req, res) => {
  try {
    let { rows } = await db.execute('SELECT * FROM user_settings WHERE user_id = ?', [req.userId])
    if (rows.length === 0) {
      await db.execute('INSERT INTO user_settings (user_id) VALUES (?)', [req.userId])
      const r2 = await db.execute('SELECT * FROM user_settings WHERE user_id = ?', [req.userId])
      rows = r2.rows
    }
    res.json(rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.patch('/api/settings', ensureDB, auth, async (req, res) => {
  try {
    const fields = ['exam_date', 'ielts_exam_date', 'ielts_target', 'pomodoro_focus', 'pomodoro_break', 'pomodoro_long_break', 'pomodoro_long_break_interval']
    const updates = [], values = []
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]) }
    }
    if (updates.length > 0) {
      values.push(req.userId)
      await db.execute(`UPDATE user_settings SET ${updates.join(',')} WHERE user_id = ?`, values)
    }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 考研计划 =====================
app.get('/api/exam-tasks', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT * FROM exam_tasks WHERE user_id = ? ORDER BY created_at', [req.userId])
    res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })))
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.post('/api/exam-tasks', ensureDB, auth, async (req, res) => {
  try {
    const { subject_id, title, date } = req.body
    const result = await db.execute(
      'INSERT INTO exam_tasks (user_id, subject_id, title, task_date) VALUES (?,?,?,?)',
      [req.userId, subject_id, title, date || new Date().toISOString().slice(0, 10)]
    )
    const { rows } = await db.execute('SELECT * FROM exam_tasks WHERE id = ?', [Number(result.lastInsertRowid)])
    const r = rows[0]
    res.json({ ...r, completed: !!r.completed, date: r.task_date })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.patch('/api/exam-tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    if (req.body.completed !== undefined) {
      await db.execute('UPDATE exam_tasks SET completed = ? WHERE id = ? AND user_id = ?',
        [req.body.completed ? 1 : 0, req.params.id, req.userId])
    }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.delete('/api/exam-tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM exam_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 雅思计划 =====================
app.get('/api/ielts-tasks', ensureDB, auth, async (req, res) => {
  try {
    const { rows } = await db.execute('SELECT * FROM ielts_tasks WHERE user_id = ? ORDER BY created_at', [req.userId])
    res.json(rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })))
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.post('/api/ielts-tasks', ensureDB, auth, async (req, res) => {
  try {
    const { skill_id, title, date } = req.body
    const result = await db.execute(
      'INSERT INTO ielts_tasks (user_id, skill_id, title, task_date) VALUES (?,?,?,?)',
      [req.userId, skill_id, title, date || new Date().toISOString().slice(0, 10)]
    )
    const { rows } = await db.execute('SELECT * FROM ielts_tasks WHERE id = ?', [Number(result.lastInsertRowid)])
    const r = rows[0]
    res.json({ ...r, completed: !!r.completed, date: r.task_date })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.patch('/api/ielts-tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    if (req.body.completed !== undefined) {
      await db.execute('UPDATE ielts_tasks SET completed = ? WHERE id = ? AND user_id = ?',
        [req.body.completed ? 1 : 0, req.params.id, req.userId])
    }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

app.delete('/api/ielts-tasks/:id', ensureDB, auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM ielts_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 批量拉取 =====================
app.get('/api/all', ensureDB, auth, async (req, res) => {
  try {
    const uid = req.userId
    const [tasksR, logsR, pomR, examR, ieltsR, settingsR] = await Promise.all([
      db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at', [uid]),
      db.execute('SELECT * FROM study_logs WHERE user_id = ? ORDER BY created_at', [uid]),
      db.execute('SELECT * FROM pomodoro_logs WHERE user_id = ? ORDER BY created_at', [uid]),
      db.execute('SELECT * FROM exam_tasks WHERE user_id = ? ORDER BY created_at', [uid]),
      db.execute('SELECT * FROM ielts_tasks WHERE user_id = ? ORDER BY created_at', [uid]),
      db.execute('SELECT * FROM user_settings WHERE user_id = ?', [uid]),
    ])

    let settings = settingsR.rows[0]
    if (!settings) {
      await db.execute('INSERT INTO user_settings (user_id) VALUES (?)', [uid])
      settings = (await db.execute('SELECT * FROM user_settings WHERE user_id = ?', [uid])).rows[0]
    }

    res.json({
      tasks: tasksR.rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date, estimatedMinutes: r.estimated_minutes, actualSeconds: r.actual_seconds })),
      studyLogs: logsR.rows.map(r => ({ ...r, date: r.log_date, timestamp: new Date(r.created_at).getTime() })),
      pomodoroLogs: pomR.rows.map(r => ({ ...r, completed: !!r.completed, date: r.log_date, timestamp: new Date(r.created_at).getTime() })),
      examTasks: examR.rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })),
      ieltsTasks: ieltsR.rows.map(r => ({ ...r, completed: !!r.completed, date: r.task_date })),
      settings,
    })
  } catch (e) { console.error(e); res.status(500).json({ error: '服务器错误' }) }
})

// ===================== 本地启动 =====================
if (require.main === module) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => console.log(`🚀 Ashore 后端已启动: http://localhost:${PORT}`))
}

// ===================== AI 生成今日计划 =====================
app.post('/api/ai/plan', ensureDB, auth, async (req, res) => {
  const AI_KEY = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || ''
  const AI_BASE = process.env.AI_BASE_URL || 'https://api.xiaomimimo.com/v1'
  const AI_MODEL = process.env.AI_MODEL || 'mimo-v2.5-pro'
  if (!AI_KEY) return res.status(500).json({ error: '未配置 AI API Key' })
  try {
    const uid = req.userId
    const [settingsR, studyR, tasksR] = await Promise.all([
      db.execute('SELECT * FROM user_settings WHERE user_id = ?', [uid]),
      db.execute("SELECT category, subject, seconds, log_date FROM study_logs WHERE user_id = ? AND log_date >= date('now', '-7 days')", [uid]),
      db.execute("SELECT title, category, completed FROM tasks WHERE user_id = ? AND task_date >= date('now', '-3 days')", [uid]),
    ])

    const settings = settingsR.rows[0] || {}
    const examDate = settings.exam_date || '2026-12-20'
    const ieltsDate = settings.ielts_exam_date || '2026-09-15'
    const ieltsTarget = settings.ielts_target || 7.0
    const daysUntilExam = Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000))
    const daysUntilIelts = Math.max(0, Math.ceil((new Date(ieltsDate) - new Date()) / 86400000))

    const studySummary = {}
    for (const r of studyR.rows) {
      const key = r.subject || r.category || '其他'
      studySummary[key] = (studySummary[key] || 0) + r.seconds
    }
    const totalTasks = tasksR.rows.length
    const completedTasks = tasksR.rows.filter(r => r.completed).length

    const prompt = `你是一个考研/雅思备考学习规划师。请根据以下信息，生成今日学习计划。

【考试信息】
- 考研(11408)：${daysUntilExam} 天后考试（${examDate}）
- 雅思：${daysUntilIelts} 天后考试（${ieltsDate}），目标 ${ieltsTarget} 分

【近7天学习情况】
${Object.entries(studySummary).map(([k, v]) => `- ${k}: ${Math.round(v / 60)} 分钟`).join('\n') || '暂无数据'}

【近3天任务完成率】
${totalTasks > 0 ? `${completedTasks}/${totalTasks}（${Math.round(completedTasks / totalTasks * 100)}%）` : '暂无数据'}

请生成今日计划，包含：
1. 考研各科（数学、英语、专业课、政治）的具体任务和建议时长
2. 雅思各科（听力、阅读、写作、口语）的具体任务和建议时长
3. 一段简短的鼓励语

要求：
- 根据剩余天数调整强度（越近越密集）
- 根据近7天学习情况平衡各科（学得少的科目多安排一些）
- 任务要具体可执行（如"张宇1000题 第5章"而不是"做数学题"）
- 总学习时长建议 8-12 小时
- 用 JSON 格式返回，格式如下：
{
  "tasks": [
    {"title": "具体任务", "category": "math/english/politics/major/listening/reading/writing/speaking", "minutes": 60},
    ...
  ],
  "encouragement": "鼓励语"
}`

    const response = await fetch(`${AI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return res.json({ tasks: [], encouragement: content, raw: content })

    try {
      const plan = JSON.parse(match[0])
      res.json(plan)
    } catch {
      res.json({ tasks: [], encouragement: content, raw: content })
    }
  } catch (e) {
    console.error('[AI]', e)
    res.status(500).json({ error: 'AI 生成失败: ' + e.message })
  }
})

module.exports = app
