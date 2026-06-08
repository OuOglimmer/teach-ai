<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

const auth = useAuthStore()
const editing = ref(false)
const nickname = ref(auth.user?.nickname || '')

const preferences = ref({
  emailNotify: true,
  smsNotify: false,
  weeklyReport: true,
  aiFeedback: true,
})

async function saveProfile() {
  if (!auth.user) return
  await api.updateProfile(auth.user.id, { nickname: nickname.value })
  auth.user!.nickname = nickname.value
  editing.value = false
}

const roleLabel: Record<string, string> = { admin: '管理员', teacher: '教师', student: '学生' }
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">个人中心</h1>
      <p class="text-sm text-gray-500 mt-1">管理你的个人信息和偏好设置</p>
    </div>

    <!-- Avatar & Basic -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center gap-6">
        <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
          {{ auth.user?.nickname?.[0] || 'U' }}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div v-if="!editing">
              <h2 class="text-xl font-bold text-gray-800">{{ auth.user?.nickname }}</h2>
            </div>
            <div v-else>
              <input v-model="nickname" class="px-3 py-1.5 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-600">{{ roleLabel[auth.user?.role || 'student'] }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">{{ auth.user?.email }}</p>
          <p class="text-xs text-gray-400 mt-1">AI启航教育 · 成都市第九百九十九中学</p>
        </div>
        <div>
          <button v-if="!editing" @click="editing = true" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">编辑资料</button>
          <div v-else class="flex gap-2">
            <button @click="saveProfile" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">保存</button>
            <button @click="editing = false; nickname = auth.user?.nickname || ''" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preferences -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 class="font-semibold text-gray-800 mb-4">偏好设置</h3>
      <div class="space-y-4">
        <div v-for="(val, key) in preferences" :key="key" class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-gray-700">
              {{ { emailNotify: '邮件通知', smsNotify: '短信通知', weeklyReport: '周报推送', aiFeedback: 'AI反馈建议' }[key] }}
            </p>
          </div>
          <button
            @click="preferences[key] = !preferences[key]"
            class="w-10 h-5 rounded-full transition-colors relative"
            :class="preferences[key] ? 'bg-indigo-600' : 'bg-gray-300'"
          >
            <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform" :class="preferences[key] ? 'translate-x-5' : 'translate-x-0.5'"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Account Security -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 class="font-semibold text-gray-800 mb-4">账号安全</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-gray-700">密码</p>
            <p class="text-xs text-gray-400">最后修改：2026-01-15</p>
          </div>
          <button class="text-sm text-indigo-600 hover:text-indigo-700">修改密码</button>
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-gray-700">绑定邮箱</p>
            <p class="text-xs text-gray-400">{{ auth.user?.email }}</p>
          </div>
          <span class="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">已验证</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-gray-700">账号状态</p>
          </div>
          <span class="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">正常</span>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-red-100">
      <h3 class="font-semibold text-red-600 mb-2">危险操作</h3>
      <p class="text-xs text-gray-400 mb-4">以下操作不可逆，请谨慎操作</p>
      <button class="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">注销账号</button>
    </div>
  </div>
</template>
