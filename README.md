# 🚀 Ashore 上岸计划

> 考研 11408 & 雅思备考一站式学习管理系统

一个为考研和雅思备考设计的个人学习管理平台，包含任务管理、番茄钟、学习数据统计等功能。

---

## ✨ 功能一览

### 📊 仪表盘
- 今日待办清单
- 今日学习时长统计
- 考研倒计时 / 雅思目标分数
- 连续打卡天数
- 本周学习趋势图

### 📋 任务管理
- 添加 / 删除任务
- 设置科目分类（数学、英语、政治、专业课等）
- 设置预计时间
- 正向计时器 — 点击开始自动记录学习时长
- 按日期、科目筛选

### 🍅 番茄钟
- 25 分钟专注 / 5 分钟短休息 / 15 分钟长休息
- 自定义时间设置
- 圆环动画倒计时
- 浏览器通知提醒
- 自动记录学习日志

### 📚 考研计划（11408）
- 数学 / 英语 / 专业课 / 政治 四科管理
- 每日任务安排 & 完成追踪
- 考研倒计时

### 🌍 雅思计划
- 听力 / 阅读 / 写作 / 口语 四技能管理
- 各项目标分数设置
- 每日练习记录

### 📈 数据统计
- 每日 / 每周学习时长柱状图
- 各科目时间占比饼图
- 连续打卡天数
- 任务完成率

### ⚙ 设置
- 修改考研 / 雅思考试日期
- 设置雅思目标分数
- 个人信息管理

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router |
| 样式 | Tailwind CSS + 自定义 CSS |
| 图表 | Chart.js |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18

### 安装

```bash
# 克隆项目
git clone https://github.com/Tallminmountain/ashore-web.git
cd ashore-web

# 安装依赖
npm install
```

### 启动

需要同时启动前端和后端：

```bash
# 终端 1：启动后端 API（端口 3000）
npm run server

# 终端 2：启动前端开发服务器（端口 5173）
npm run dev
```

打开浏览器访问 http://localhost:5173

---

## 📁 项目结构

```
ashore-web/
├── server/                 # 后端
│   ├── index.cjs           # Express API 服务
│   └── db.cjs              # SQLite 数据库 & 建表
├── src/
│   ├── composables/
│   │   ├── useAuth.js      # 登录注册认证
│   │   └── useStore.js     # 数据管理（任务、日志、计划等）
│   ├── views/
│   │   ├── Auth.vue        # 登录注册页
│   │   ├── Dashboard.vue   # 仪表盘
│   │   ├── Tasks.vue       # 任务管理
│   │   ├── Pomodoro.vue    # 番茄钟
│   │   ├── ExamPlan.vue    # 考研计划
│   │   ├── IeltsPlan.vue   # 雅思计划
│   │   ├── Stats.vue       # 数据统计
│   │   └── Settings.vue    # 设置
│   ├── App.vue             # 主布局（侧边栏）
│   ├── main.js             # 路由 & 入口
│   └── assets/main.css     # 全局样式
├── index.html
├── vite.config.js
└── package.json
```

---

## 📝 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/all` | 批量拉取所有数据 |
| GET/POST/PATCH/DELETE | `/api/tasks` | 任务 CRUD |
| GET/POST | `/api/study-logs` | 学习日志 |
| GET/POST | `/api/pomodoro-logs` | 番茄钟日志 |
| GET/PATCH | `/api/settings` | 用户设置 |
| GET/POST/PATCH/DELETE | `/api/exam-tasks` | 考研任务 |
| GET/POST/PATCH/DELETE | `/api/ielts-tasks` | 雅思任务 |

---

## 📌 备份

数据库文件为 `ashore.db`（SQLite），位于项目根目录。重装系统前请备份此文件。

---

## 📄 License

MIT
