import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { Profile, Role } from '@/types'

const isReal = import.meta.env.VITE_USE_REAL_SUPABASE === 'true'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Profile | null>(null)
  const loading = ref(true)
  const pendingApproval = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed<Role | null>(() => user.value?.role || null)

  const isAdmin = computed(() => role.value === 'admin')
  const isTeacher = computed(() => role.value === 'teacher' || role.value === 'admin')
  const isStudent = computed(() => role.value === 'student')

  async function ensureProfile(id: string, meta?: { email?: string; role?: string; nickname?: string }) {
    let profile = await api.getProfile(id)
    if (!profile && isReal) {
      try {
        await supabase.from('profiles').insert({
          id,
          email: meta?.email || '',
          nickname: meta?.nickname || meta?.email?.split('@')[0] || '用户',
          role: meta?.role || 'student',
          school: 'AI启航教育',
        })
        profile = await api.getProfile(id)
      } catch { /* table may not exist yet */ }
    }
    return profile
  }

  async function init() {
    loading.value = true

    if (!isReal) {
      const cached = localStorage.getItem('demo_session')
      if (!cached) {
        await api.signIn('admin@test.com', '123456')
      }
    }

    const session = await api.getSession()
    if (session?.user) {
      const profile = await ensureProfile(session.user.id, {
        email: session.user.email,
        role: session.user.user_metadata?.role,
        nickname: session.user.user_metadata?.nickname,
      })
      if (profile) user.value = profile
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await ensureProfile(session.user.id, {
          email: session.user.email,
          role: session.user.user_metadata?.role,
          nickname: session.user.user_metadata?.nickname,
        })
        if (profile) user.value = profile
      } else if (event === 'SIGNED_OUT') {
        user.value = null
      }
    })
  }

  async function login(email: string, password: string) {
    pendingApproval.value = false
    const data = await api.signIn(email, password)
    if (data?.user) {
      const profile = await ensureProfile(data.user.id, {
        email: data.user.email,
        role: data.user.user_metadata?.role,
      })
      if (profile) user.value = profile
    }
  }

  async function register(email: string, password: string, role: string = 'student', nickname: string = '') {
    if (role === 'teacher' || role === 'admin') {
      await api.createRegistrationApproval({
        email,
        nickname: nickname || email.split('@')[0],
        role: role as 'teacher' | 'admin',
        school: 'AI启航教育',
        status: 'pending'
      })
      pendingApproval.value = true
      return
    }
    await api.signUp(email, password, role)
  }

  async function logout() {
    await api.signOut()
    user.value = null
    pendingApproval.value = false
  }

  return { user, loading, pendingApproval, isAuthenticated, role, isAdmin, isTeacher, isStudent, init, login, register, logout }
})
