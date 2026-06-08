<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const sidebarCollapsed = ref(false)

const menuItems = computed(() => [
  { path: '/dashboard', label: '工作台首页', icon: '📊', roles: ['student', 'teacher', 'admin'] },
  { path: '/student', label: '学生学习辅导', icon: '📚', roles: ['student', 'teacher', 'admin'] },
  { path: '/student/qa', label: 'AI答疑', icon: '💬', roles: ['student', 'teacher', 'admin'] },
  { path: '/student/suggestions', label: '学习建议', icon: '💡', roles: ['student', 'teacher', 'admin'] },
  { path: '/student/practice', label: '个性化练习', icon: '✏️', roles: ['student', 'teacher', 'admin'] },
  { path: '/teacher/prepare', label: '教师备课中心', icon: '📝', roles: ['teacher', 'admin'] },
  { path: '/teacher/exams', label: '作业与考试中心', icon: '📋', roles: ['teacher', 'admin'] },
  { path: '/teacher/resources', label: '教学资源中心', icon: '📁', roles: ['teacher', 'admin'] },
  { path: '/analysis', label: '学情分析中心', icon: '📈', roles: ['teacher', 'admin'] },
  { path: '/history', label: 'AI对话历史', icon: '🕐', roles: ['student', 'teacher', 'admin'] },
  { path: '/management', label: '班级/学校管理', icon: '⚙️', roles: ['admin'] },
  { path: '/profile', label: '个人中心', icon: '👤', roles: ['student', 'teacher', 'admin'] },
  { path: '/usage', label: 'API用量统计', icon: '📊', roles: ['student', 'teacher', 'admin'] },
].filter(item => item.roles.includes(auth.role || '')))

function navigate(path: string) {
  router.push(path)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="bg-white border-r border-gray-200 flex flex-col transition-all duration-300"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <div class="h-16 flex items-center px-4 border-b border-gray-200">
        <span v-if="!sidebarCollapsed" class="text-lg font-bold text-indigo-600">AI 教学工作台</span>
        <span v-else class="text-lg font-bold text-indigo-600 mx-auto">AI</span>
      </div>
      <nav class="flex-1 overflow-y-auto py-2">
        <button
          v-for="item in menuItems"
          :key="item.path"
          @click="navigate(item.path)"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          :class="route.path === item.path ? 'bg-indigo-50 text-indigo-600 font-medium border-r-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="truncate">{{ item.label }}</span>
        </button>
      </nav>
      <div class="border-t border-gray-200 p-4">
        <button
          @click="sidebarCollapsed = !sidebarCollapsed"
          class="w-full text-xs text-gray-400 hover:text-gray-600"
        >
          {{ sidebarCollapsed ? '展开' : '收起' }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>{{ route.meta.title }}</span>
        </div>
        <div class="flex items-center gap-4">
          <button class="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <span class="text-lg">🔔</span>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <span class="text-lg">⚙️</span>
          </button>
          <div class="flex items-center gap-2 cursor-pointer" @click="navigate('/profile')">
            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-medium">
              {{ auth.user?.nickname?.[0] || 'U' }}
            </div>
            <div class="text-sm">
              <p class="font-medium text-gray-700">{{ auth.user?.nickname || '用户' }}</p>
              <p class="text-xs text-gray-400">{{ auth.user?.role === 'admin' ? '管理员' : auth.user?.role === 'teacher' ? '教师' : '学生' }}</p>
            </div>
          </div>
          <button @click="handleLogout" class="text-sm text-gray-400 hover:text-red-500 ml-2">退出</button>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <router-view />
      </main>
    </div>
  </div>
</template>
