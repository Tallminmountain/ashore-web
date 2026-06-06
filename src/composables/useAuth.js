import { ref, computed } from 'vue'

const API = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
const TOKEN_KEY = 'ashore_token'
const USER_KEY = 'ashore_user'

const currentUser = ref(null)
const authLoading = ref(true)

// 从 localStorage 恢复登录状态
function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const user = localStorage.getItem(USER_KEY)
  if (token && user) {
    try { currentUser.value = JSON.parse(user) } catch { currentUser.value = null }
  }
  authLoading.value = false
}

loadSession()

// 验证 token 是否还有效
async function verifyToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) { authLoading.value = false; return }
  try {
    const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const user = await res.json()
      currentUser.value = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      currentUser.value = null
    }
  } catch { }
  authLoading.value = false
}

verifyToken()

export function useAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)

  async function register(email, password, username, nickname) {
    if (!email?.trim() || !password || !username?.trim()) {
      return { success: false, message: '请填写完整信息' }
    }
    if (password.length < 4) return { success: false, message: '密码至少4个字符' }

    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, username: username.trim(), nickname: nickname?.trim() || username.trim() }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.error || '注册失败' }

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    currentUser.value = data.user
    return { success: true, message: '注册成功' }
  }

  async function login(email, password) {
    if (!email?.trim() || !password) return { success: false, message: '请填写邮箱和密码' }

    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.error || '登录失败' }

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    currentUser.value = data.user
    return { success: true, message: '登录成功' }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    currentUser.value = null
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || ''
  }

  return { currentUser, isLoggedIn, authLoading, register, login, logout, getToken }
}
