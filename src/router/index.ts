import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    roles?: Role[]
    hideInMenu?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/Login.vue'),
      meta: { title: '登录', hideInMenu: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { title: '首页' },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/dashboard/Index.vue'),
          meta: { title: '工作台首页', icon: 'home' }
        },
        {
          path: 'student',
          name: 'Student',
          component: () => import('@/pages/student/Index.vue'),
          meta: { title: '学生学习辅导', icon: 'book', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'student/qa',
          name: 'AiQA',
          component: () => import('@/pages/student/AiQA.vue'),
          meta: { title: 'AI答疑', icon: 'message', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'student/suggestions',
          name: 'Suggestions',
          component: () => import('@/pages/student/Suggestions.vue'),
          meta: { title: '学习建议', icon: 'bulb', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'student/practice',
          name: 'Practice',
          component: () => import('@/pages/student/Practice.vue'),
          meta: { title: '个性化练习', icon: 'edit', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'teacher/prepare',
          name: 'TeacherPrepare',
          component: () => import('@/pages/teacher/PrepareCenter.vue'),
          meta: { title: '教师备课中心', icon: 'presentation', roles: ['teacher', 'admin'] }
        },
        {
          path: 'teacher/exams',
          name: 'TeacherExams',
          component: () => import('@/pages/teacher/ExamCenter.vue'),
          meta: { title: '作业与考试中心', icon: 'clipboard', roles: ['teacher', 'admin'] }
        },
        {
          path: 'teacher/resources',
          name: 'TeacherResources',
          component: () => import('@/pages/teacher/ResourceCenter.vue'),
          meta: { title: '教学资源中心', icon: 'folder', roles: ['teacher', 'admin'] }
        },
        {
          path: 'analysis',
          name: 'Analysis',
          component: () => import('@/pages/analysis/Index.vue'),
          meta: { title: '学情分析中心', icon: 'chart', roles: ['teacher', 'admin'] }
        },
        {
          path: 'history',
          name: 'History',
          component: () => import('@/pages/history/Index.vue'),
          meta: { title: 'AI对话历史', icon: 'clock', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'management',
          name: 'Management',
          component: () => import('@/pages/management/Index.vue'),
          meta: { title: '班级/学校管理', icon: 'settings', roles: ['admin'] }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/pages/profile/Index.vue'),
          meta: { title: '个人中心', icon: 'user', roles: ['student', 'teacher', 'admin'] }
        },
        {
          path: 'usage',
          name: 'Usage',
          component: () => import('@/pages/usage/Index.vue'),
          meta: { title: 'API用量统计', icon: 'chart', roles: ['student', 'teacher', 'admin'] }
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.name === 'Login') {
    next()
    return
  }

  if (!auth.isAuthenticated) {
    next({ name: 'Login' })
    return
  }

  const roles = to.meta.roles
  if (roles && auth.role && !roles.includes(auth.role)) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
