<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { register, login } = useAuth()

const mode = ref('login')
const form = ref({
  email: '',
  password: '',
  username: '',
  nickname: '',
  confirmPassword: '',
})
const error = ref('')
const success = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    if (mode.value === 'login') {
      if (!form.value.email.trim() || !form.value.password) {
        error.value = '请填写邮箱和密码'
        loading.value = false
        return
      }
      const result = await login(form.value.email, form.value.password)
      if (!result.success) {
        error.value = result.message
      } else {
        router.push('/')
      }
    } else {
      if (!form.value.email.trim() || !form.value.password || !form.value.username.trim()) {
        error.value = '请填写邮箱、用户名和密码'
        loading.value = false
        return
      }
      if (form.value.password !== form.value.confirmPassword) {
        error.value = '两次密码输入不一致'
        loading.value = false
        return
      }
      const result = await register(
        form.value.email,
        form.value.password,
        form.value.username,
        form.value.nickname
      )
      if (!result.success) {
        error.value = result.message
      } else {
        success.value = result.message
        setTimeout(() => router.push('/'), 500)
      }
    }
  } catch (e) {
    error.value = '网络错误: ' + (e.message || '无法连接服务器，请确认后端已启动')
  }
  loading.value = false
}

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
  success.value = ''
  form.value = { email: '', password: '', username: '', nickname: '', confirmPassword: '' }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); position: relative; overflow: hidden;">
    <div style="position: absolute; top: -120px; right: -120px; width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.03);"></div>
    <div style="position: absolute; bottom: -80px; left: -80px; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.03);"></div>

    <div style="width: 100%; max-width: 440px; padding: 20px;">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: white; margin-bottom: 16px;">A</div>
        <h1 style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.02em;">Ashore</h1>
        <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px;">上岸计划 · 备考学习管理系统</p>
      </div>

      <!-- Form Card -->
      <div style="background: white; border-radius: 16px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <!-- Tabs -->
        <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; margin-bottom: 24px;">
          <button
            @click="mode = 'login'; error = ''; success = ''"
            style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;"
            :style="{ background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? '#4f46e5' : '#64748b', boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }"
          >登录</button>
          <button
            @click="mode = 'register'; error = ''; success = ''"
            style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;"
            :style="{ background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? '#4f46e5' : '#64748b', boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }"
          >注册</button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div v-if="error" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ error }}
          </div>

          <div v-if="success" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {{ success }}
          </div>

          <div v-if="mode === 'register'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input v-model="form.username" class="input" placeholder="英文用户名" style="padding: 12px; font-size: 14px;">
            </div>
            <div class="form-group">
              <label class="form-label">昵称</label>
              <input v-model="form.nickname" class="input" placeholder="显示名称" style="padding: 12px; font-size: 14px;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">邮箱</label>
            <input v-model="form.email" type="email" class="input" placeholder="输入邮箱地址" style="padding: 12px; font-size: 14px;" autocomplete="email">
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="输入密码" style="padding: 12px; font-size: 14px;" autocomplete="current-password">
          </div>

          <div v-if="mode === 'register'" class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">确认密码</label>
            <input v-model="form.confirmPassword" type="password" class="input" placeholder="再次输入密码" style="padding: 12px; font-size: 14px;">
          </div>

          <button
            type="submit"
            :disabled="loading"
            style="width: 100%; padding: 13px; border-radius: 10px; border: none; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s; margin-top: 8px;"
            :style="{ opacity: loading ? 0.7 : 1 }"
          >
            {{ loading ? '处理中...' : (mode === 'login' ? '登 录' : '注 册') }}
          </button>
        </form>

        <div style="text-align: center; margin-top: 20px; font-size: 13px; color: #64748b;">
          <span v-if="mode === 'login'">还没有账号？</span>
          <span v-else>已有账号？</span>
          <button @click="switchMode" style="background: none; border: none; color: #6366f1; font-weight: 600; cursor: pointer; font-size: 13px; padding: 0; margin-left: 4px;">
            {{ mode === 'login' ? '立即注册' : '去登录' }}
          </button>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: rgba(255,255,255,0.3);">
        数据存储在本地 SQLite 数据库 · Node.js 后端
      </div>
    </div>
  </div>
</template>
