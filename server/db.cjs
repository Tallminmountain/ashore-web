const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'ashore.db'))

// 开启 WAL 模式，性能更好
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
  );

  CREATE TABLE IF NOT EXISTS study_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'general',
    subject TEXT DEFAULT '',
    seconds INTEGER NOT NULL,
    log_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pomodoro_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    log_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exam_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    task_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ielts_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    task_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    exam_date TEXT DEFAULT '2026-12-20',
    ielts_exam_date TEXT DEFAULT '2026-09-15',
    ielts_target REAL DEFAULT 7.0,
    pomodoro_focus INTEGER DEFAULT 25,
    pomodoro_break INTEGER DEFAULT 5,
    pomodoro_long_break INTEGER DEFAULT 15,
    pomodoro_long_break_interval INTEGER DEFAULT 4
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date);
  CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, log_date);
  CREATE INDEX IF NOT EXISTS idx_pomodoro_logs_user_date ON pomodoro_logs(user_id, log_date);
  CREATE INDEX IF NOT EXISTS idx_exam_tasks_user ON exam_tasks(user_id, task_date);
  CREATE INDEX IF NOT EXISTS idx_ielts_tasks_user ON ielts_tasks(user_id, task_date);
`)

module.exports = db
