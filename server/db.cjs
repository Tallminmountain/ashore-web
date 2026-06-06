// 自动检测环境：本地用 SQLite，Vercel 用 Turso
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
let db

if (process.env.TURSO_URL) {
  // Vercel / 生产环境 → Turso
  const { createClient } = require('@libsql/client')
  db = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
} else {
  // 本地开发 → SQLite
  const Database = require('better-sqlite3')
  const path = require('path')
  const sqlite = new Database(path.join(__dirname, '..', 'ashore.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // 包装成统一的异步接口
  db = {
    async execute(sql, params = []) {
      const stmt = sqlite.prepare(sql)
      if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
        return { rows: stmt.all(...params) }
      }
      const result = stmt.run(...params)
      return { rows: [], lastInsertRowid: result.lastInsertRowid, changes: result.changes }
    },
    async batch(stmts) {
      const results = []
      for (const s of stmts) {
        results.push(await this.execute(s.sql, s.args || []))
      }
      return results
    }
  }
}

// 建表
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      subject TEXT DEFAULT '',
      estimated_minutes INTEGER DEFAULT 30,
      completed INTEGER DEFAULT 0,
      actual_seconds INTEGER DEFAULT 0,
      task_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT DEFAULT 'general',
      subject TEXT DEFAULT '',
      seconds INTEGER NOT NULL,
      log_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pomodoro_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      log_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS exam_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      task_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ielts_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      task_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      exam_date TEXT DEFAULT '2026-12-20',
      ielts_exam_date TEXT DEFAULT '2026-09-15',
      ielts_target REAL DEFAULT 7.0,
      pomodoro_focus INTEGER DEFAULT 25,
      pomodoro_break INTEGER DEFAULT 5,
      pomodoro_long_break INTEGER DEFAULT 15,
      pomodoro_long_break_interval INTEGER DEFAULT 4
    )
  `)

  // 索引
  await db.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date)')
  await db.execute('CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, log_date)')
  await db.execute('CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date ON pomodoro_logs(user_id, log_date)')
  await db.execute('CREATE INDEX IF NOT EXISTS idx_exam_tasks_user ON exam_tasks(user_id, task_date)')
  await db.execute('CREATE INDEX IF NOT EXISTS idx_ielts_tasks_user ON ielts_tasks(user_id, task_date)')
}

module.exports = { db, initDB }
