import { createClient } from '@supabase/supabase-js'
import type { Profile, AiConversation, LearningSuggestion, PracticeExercise } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isDemo = supabaseUrl.includes('placeholder')

// ========== Mock Data ==========
const demoUser: Profile = {
  id: 'demo-user-id',
  email: 'admin@test.com',
  nickname: '管理员',
  avatar_url: null,
  role: 'admin',
  school: 'AI启航教育',
  created_at: new Date().toISOString(),
}

const demoConversations: AiConversation[] = [
  {
    id: '1', user_id: 'demo-user-id', title: '二次函数求解问题', messages: [
      { role: 'user', content: '如何求解二次函数的最值？', created_at: new Date().toISOString() },
      { role: 'assistant', content: '对于二次函数 f(x)=ax²+bx+c，当 a>0 时开口向上，顶点处取最小值...', created_at: new Date().toISOString() },
    ], status: 'resolved', subject: '数学', created_at: '2026-05-20T10:00:00Z', updated_at: '2026-05-20T10:05:00Z',
  },
  {
    id: '2', user_id: 'demo-user-id', title: '英语时态疑问', messages: [
      { role: 'user', content: '现在完成时和过去式的区别？', created_at: new Date().toISOString() },
    ], status: 'active', subject: '英语', created_at: '2026-05-21T14:00:00Z', updated_at: '2026-05-21T14:00:00Z',
  },
]

// ========== Mock Client ==========
function createMockClient() {
  let currentUser: any = null
  const listeners: Array<(event: string, session: any) => void> = []

  const mockSelect = (table: string) => ({
    select: (columns?: string) => ({
      eq: (col: string, val: any) => ({
        single: async () => {
          if (table === 'profiles' && col === 'id') return { data: demoUser, error: null }
          return { data: null, error: null }
        },
        order: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        data: null, error: null,
      }),
      order: (col: string, opts?: any) => ({
        limit: async (n: number) => {
          if (table === 'ai_conversations') return { data: demoConversations, error: null }
          return { data: [], error: null }
        },
        data: null, error: null,
      }),
      data: null, error: null,
    }),
  })

  return {
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        currentUser = { id: demoUser.id, email, user_metadata: { role: demoUser.role } }
        listeners.forEach(fn => fn('SIGNED_IN', { user: currentUser }))
        return { data: { user: currentUser, session: { user: currentUser } }, error: null }
      },
      signUp: async ({ email, password, options }: any) => {
        currentUser = { id: demoUser.id, email, user_metadata: { role: options?.data?.role || 'student' } }
        return { data: { user: currentUser, session: { user: currentUser } }, error: null }
      },
      signOut: async () => {
        currentUser = null
        listeners.forEach(fn => fn('SIGNED_OUT', null))
        return { error: null }
      },
      getSession: async () => ({ data: { session: currentUser ? { user: currentUser } : null }, error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback)
        return { data: { subscription: { unsubscribe: () => { } } } }
      },
    },
    from: (table: string) => {
      const builder: any = {
        select: (columns?: string) => ({
          ...mockSelect(table),
          eq: (col: string, val: any) => ({
            single: async () => {
              if (table === 'profiles') return { data: demoUser, error: null }
              return { data: null, error: null }
            },
            order: (col: string, opts?: any) => ({
              limit: async (n: number) => {
              if (table === 'ai_conversations') return { data: demoConversations, error: null }
              if (table === 'learning_suggestions') return { data: [], error: null }
              if (table === 'practice_exercises') return { data: [], error: null }
              if (table === 'registration_approvals') return { data: [
                { id: 'r1', email: 'teacher@test.com', nickname: '张老师', role: 'teacher', school: 'AI启航教育', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 'r2', email: 'admin2@test.com', nickname: '李管理', role: 'admin', school: 'AI启航教育', status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() },
              ], error: null }
              if (table === 'homework') return { data: [
                { id: 'hw1', class_id: 'c1', teacher_id: demoUser.id, title: '二次函数练习题', description: '完成课本P45-P48练习题', due_date: new Date(Date.now() + 86400000 * 3).toISOString(), total_score: 100, status: 'published', created_at: new Date().toISOString(), class: { name: '九年级(1)班' } },
              ], error: null }
              if (table === 'homework_submissions') return { data: [
                { id: 's1', homework_id: 'hw1', student_id: 's1', content: '已完成所有题目', score: null, graded: false, submitted_at: new Date().toISOString(), student: { nickname: '张三', email: 'zhang@test.com' } },
              ], error: null }
              if (table === 'class_students') return { data: [
                { id: 'cs1', class_id: 'c1', student_id: 's1', student: { id: 's1', nickname: '张三', email: 'zhang@test.com' } },
                { id: 'cs2', class_id: 'c1', student_id: 's2', student: { id: 's2', nickname: '李四', email: 'li@test.com' } },
              ], error: null }
                return { data: [], error: null }
              },
              data: null, error: null,
            }),
            data: null, error: null,
          }),
          order: (col: string, opts?: any) => ({
            limit: async (n: number) => {
              if (table === 'ai_conversations') return { data: demoConversations, error: null }
              if (table === 'classes') return { data: [{ id: 'c1', name: '九年级(1)班', grade: '九年级', created_by: demoUser.id, created_at: new Date().toISOString() }], error: null }
              if (table === 'exams') return { data: [
                { id: 'e1', class_id: 'c1', teacher_id: demoUser.id, title: '期中数学考试', duration: 120, total_score: 150, questions: [], start_time: new Date(Date.now() - 86400000 * 7).toISOString(), end_time: new Date(Date.now() - 86400000 * 7 + 7200000).toISOString(), status: 'done', created_at: new Date(Date.now() - 86400000 * 14).toISOString(), class: { name: '九年级(1)班' } },
                { id: 'e2', class_id: 'c1', teacher_id: demoUser.id, title: '单元测验：二次函数', duration: 60, total_score: 100, questions: [], start_time: new Date(Date.now() - 86400000 * 2).toISOString(), end_time: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), status: 'grading', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), class: { name: '九年级(1)班' } },
              ], error: null }
              if (table === 'exam_results') return { data: [
                { id: 'er1', exam_id: 'e1', student_id: 's1', score: 135, answers: {}, graded: true, submitted_at: new Date(Date.now() - 86400000 * 7).toISOString(), student: { nickname: '张三', email: 'zhang@test.com' } },
                { id: 'er2', exam_id: 'e1', student_id: 's2', score: 120, answers: {}, graded: true, submitted_at: new Date(Date.now() - 86400000 * 7).toISOString(), student: { nickname: '李四', email: 'li@test.com' } },
                { id: 'er3', exam_id: 'e2', student_id: 's1', score: null, answers: {}, graded: false, submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(), student: { nickname: '张三', email: 'zhang@test.com' } },
              ], error: null }
              if (table === 'resources') return { data: [], error: null }
              if (table === 'class_stats') return { data: [], error: null }
              return { data: [], error: null }
            },
            data: null, error: null,
          }),
        }),
        insert: (values: any) => ({
          select: () => ({
            single: async () => {
              const id = String(Date.now())
              return { data: { id, ...values }, error: null }
            },
          }),
        }),
        update: (values: any) => ({
          eq: (col: string, val: any) => ({
            select: () => ({
              single: async () => ({ data: { id: val, ...values }, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: (col: string, val: any) => ({
            then: (resolve: any) => resolve({ data: null, error: null }),
          }),
        }),
      }
      return builder
    },
    rpc: (fn: string, params: any) => {
      if (fn === 'vault_get_secret') return Promise.resolve({ data: import.meta.env.VITE_DEEPSEEK_API_KEY || null, error: null })
      if (fn === 'vault_upsert_secret') return Promise.resolve({ data: null, error: null })
      if (fn === 'get_class_grades') return Promise.resolve({ data: [
        { student_id: 's1', nickname: '张三', scores: [{ exam: '期中数学考试', score: 135 }, { exam: '单元测验：二次函数', score: null }], avg: 135 },
        { student_id: 's2', nickname: '李四', scores: [{ exam: '期中数学考试', score: 120 }, { exam: '单元测验：二次函数', score: null }], avg: 120 },
      ], error: null })
      return Promise.resolve({ data: [], error: null })
    },
    channel: () => ({ on: () => ({ subscribe: () => { } }) }),
    removeChannel: () => { },
  }
}

export const supabase = isDemo ? createMockClient() as any : createClient(supabaseUrl, supabaseAnonKey)
