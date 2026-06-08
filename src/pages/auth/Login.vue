<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const role = ref('student')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }

  loading.value = true
  try {
    if (isLogin.value) {
      await auth.login(email.value, password.value)
      router.push('/dashboard')
    } else {
      await auth.register(email.value, password.value, role.value, nickname.value)
      if (auth.pendingApproval) {
        return
      }
      router.push('/dashboard')
    }
  } catch (e: any) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 to-blue-100">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4">
      <div class="text-center mb-8">
        <div class="text-4xl mb-2">📚</div>
        <h1 class="text-2xl font-bold text-gray-800">AI 教学工作台</h1>
        <p class="text-sm text-gray-500 mt-1">AI启航教育 · 成都市第九百九十九中学</p>
      </div>

      <!-- Pending Approval Message -->
      <div v-if="auth.pendingApproval" class="text-center py-8">
        <div class="text-6xl mb-4">⏳</div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">注册申请已提交</h2>
        <p class="text-sm text-gray-500 mb-6">
          您的{{ role === 'teacher' ? '教师' : '管理员' }}账号注册申请已发送给管理员审核。<br>
          请耐心等待管理员审批通过后，再登录使用。
        </p>
        <button
          @click="auth.pendingApproval = false; isLogin = true"
          class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          返回登录
        </button>
      </div>

      <!-- Login / Register Form -->
      <template v-else>
        <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            class="flex-1 py-2 text-sm rounded-md transition-colors"
            :class="isLogin ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500'"
            @click="isLogin = true"
          >登录</button>
          <button
            class="flex-1 py-2 text-sm rounded-md transition-colors"
            :class="!isLogin ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500'"
            @click="isLogin = false"
          >注册</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="请输入邮箱"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="请输入密码"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="请再次输入密码"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input
              v-model="nickname"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="请输入昵称"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              v-model="role"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="student">学生</option>
              <option value="teacher">教师（需管理员审批）</option>
              <option value="admin">管理员（需管理员审批）</option>
            </select>
            <p v-if="role !== 'student'" class="text-xs text-amber-600 mt-1">⚠️ 教师和管理员注册需要管理员审批通过后方可登录</p>
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          演示账号: admin@test.com / 123456
        </p>
      </template>
    </div>
  </div>
</template>
