import { createClient } from '@supabase/supabase-js'
import type { Profile, AiConversation, LearningSuggestion, PracticeExercise } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isDemo = import.meta.env.VITE_USE_REAL_SUPABASE !== 'true'

// ========== Mock Data ==========
const demoAccounts: Record<string, Profile> = {
  'admin@test.com':  { id: 'admin-id', email: 'admin@test.com', nickname: '管理员', avatar_url: null, role: 'admin', school: 'AI启航教育', created_at: new Date().toISOString() },
  'teacher@test.com': { id: 'teacher-id', email: 'teacher@test.com', nickname: '张老师', avatar_url: null, role: 'teacher', school: 'AI启航教育', created_at: new Date().toISOString() },
  'student@test.com': { id: 'student-id', email: 'student@test.com', nickname: '李明', avatar_url: null, role: 'student', school: 'AI启航教育', created_at: new Date().toISOString() },
}

function getDemoUser(email: string): Profile {
  return demoAccounts[email] || demoAccounts['admin@test.com']
}

// ========== Persistent Mock Stores ==========
const stores: Record<string, any[]> = {
  ai_conversations: [
    { id: '1', user_id: 'admin-id', title: '二次函数求解问题', messages: [{ role: 'user', content: '如何求解二次函数的最值？', created_at: new Date().toISOString() }, { role: 'assistant', content: '对于二次函数 f(x)=ax²+bx+c，当 a>0 时开口向上，顶点处取最小值...', created_at: new Date().toISOString() }], status: 'resolved', subject: '数学', created_at: '2026-05-20T10:00:00Z', updated_at: '2026-05-20T10:05:00Z' },
    { id: '2', user_id: 'admin-id', title: '英语时态疑问', messages: [{ role: 'user', content: '现在完成时和过去式的区别？', created_at: new Date().toISOString() }], status: 'active', subject: '英语', created_at: '2026-05-21T14:00:00Z', updated_at: '2026-05-21T14:00:00Z' },
  ],
  classes: [
    { id: 'c1', name: '九年级(1)班', grade: '九年级', created_by: 'admin-id', created_at: new Date().toISOString() },
  ],
  exams: [
    { id: 'e1', class_id: 'c1', teacher_id: 'admin-id', title: '期中数学考试', duration: 120, total_score: 150, questions: [], start_time: new Date(Date.now() - 86400000 * 7).toISOString(), end_time: new Date(Date.now() - 86400000 * 7 + 7200000).toISOString(), status: 'done', created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
    { id: 'e2', class_id: 'c1', teacher_id: 'admin-id', title: '单元测验：二次函数', duration: 60, total_score: 100, questions: [], start_time: new Date(Date.now() - 86400000 * 2).toISOString(), end_time: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), status: 'grading', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  ],
  exam_results: [
    { id: 'er1', exam_id: 'e1', student_id: 's1', score: 135, answers: {}, graded: true, submitted_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 'er2', exam_id: 'e1', student_id: 's2', score: 120, answers: {}, graded: true, submitted_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 'er3', exam_id: 'e2', student_id: 's1', score: null, answers: {}, graded: false, submitted_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  tests: [
    { id: 't1', class_id: 'c1', teacher_id: 'admin-id', title: '期中数学考试', exam_type: 'midterm', duration: 120, total_score: 150, start_time: new Date(Date.now() - 86400000 * 7).toISOString(), end_time: new Date(Date.now() - 86400000 * 7 + 7200000).toISOString(), status: 'done', created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
    { id: 't2', class_id: 'c1', teacher_id: 'admin-id', title: '单元测验：二次函数', exam_type: 'quiz', duration: 60, total_score: 100, start_time: new Date(Date.now() - 86400000 * 2).toISOString(), end_time: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), status: 'grading', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  ],
  homework: [
    { id: 'hw1', class_id: 'c1', teacher_id: 'admin-id', title: '二次函数练习题', description: '完成课本P45-P48练习题', due_date: new Date(Date.now() + 86400000 * 3).toISOString(), total_score: 100, status: 'published', created_at: new Date().toISOString() },
  ],
  homework_submissions: [
    { id: 's1', homework_id: 'hw1', student_id: 's1', content: '已完成所有题目', score: null, graded: false, submitted_at: new Date().toISOString() },
  ],
  class_students: [
    { id: 'cs1', class_id: 'c1', student_id: 's1' },
    { id: 'cs2', class_id: 'c1', student_id: 's2' },
  ],
  registration_approvals: [
    { id: 'r1', email: 'teacher@test.com', nickname: '张老师', role: 'teacher', school: 'AI启航教育', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'r2', email: 'admin2@test.com', nickname: '李管理', role: 'admin', school: 'AI启航教育', status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() },
  ],
  profiles: Object.values(demoAccounts),
  resources: [],
  class_stats: [],
  learning_suggestions: [],
  practice_exercises: [],
}

// Profiles lookup helper
const profilesStore = [
  { id: 's1', nickname: '张三', email: 'zhang@test.com' },
  { id: 's2', nickname: '李四', email: 'li@test.com' },
]

// ========== Mock Client ==========
function createMockClient() {
  let currentUser: any = null
  const listeners: Array<(event: string, session: any) => void> = []

  function getStore(table: string): any[] {
    return stores[table] || []
  }

  function resolveJoins(rows: any[], table: string): any[] {
    if (table === 'exams' || table === 'tests' || table === 'homework') {
      const classStore = getStore('classes')
      return rows.map(r => ({ ...r, class: classStore.find(c => c.id === r.class_id) || null }))
    }
    if (table === 'exam_results' || table === 'homework_submissions') {
      return rows.map(r => {
        const p = profilesStore.find(p => p.id === r.student_id) || profilesStore[0]
        return { ...r, student: p }
      })
    }
    if (table === 'class_students') {
      return rows.map(r => {
        const p = profilesStore.find(p => p.id === r.student_id)
        return { ...r, student: { id: r.student_id, ...p } }
      })
    }
    return rows
  }

  function queryTable(table: string, filters?: { col: string; val: any }[]): any[] {
    let rows = [...getStore(table)]
    if (filters) {
      for (const f of filters) {
        rows = rows.filter(r => r[f.col] === f.val)
      }
    }
    return resolveJoins(rows, table)
  }

  return {
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        const profile = getDemoUser(email)
        currentUser = { id: profile.id, email, user_metadata: { role: profile.role } }
        try { localStorage.setItem('demo_session', JSON.stringify(currentUser)) } catch {}
        listeners.forEach(fn => fn('SIGNED_IN', { user: currentUser }))
        return { data: { user: currentUser, session: { user: currentUser } }, error: null }
      },
      signUp: async ({ email, password, options }: any) => {
        const profile = getDemoUser(email)
        currentUser = { id: profile.id, email, user_metadata: { role: options?.data?.role || profile.role } }
        try { localStorage.setItem('demo_session', JSON.stringify(currentUser)) } catch {}
        return { data: { user: currentUser, session: { user: currentUser } }, error: null }
      },
      signOut: async () => {
        currentUser = null
        try { localStorage.removeItem('demo_session') } catch {}
        listeners.forEach(fn => fn('SIGNED_OUT', null))
        return { error: null }
      },
      getSession: async () => {
        if (!currentUser) {
          try {
            const cached = localStorage.getItem('demo_session')
            if (cached) currentUser = JSON.parse(cached)
          } catch {}
        }
        return { data: { session: currentUser ? { user: currentUser } : null }, error: null }
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback)
        return { data: { subscription: { unsubscribe: () => { } } } }
      },
    },
    from: (table: string) => {
      const filters: { col: string; val: any }[] = []
      let orderCol = 'created_at'
      let orderDesc = true
      let limitCount = 0

      const queryMethods: any = {
        eq: (col: string, val: any) => {
          filters.push({ col, val })
          return queryMethods
        },
        order: (col: string, opts?: any) => {
          orderCol = col
          orderDesc = opts?.ascending !== true
          return queryMethods
        },
        limit: (n: number) => {
          limitCount = n
          return queryMethods
        },
        single: async () => {
          let rows = queryTable(table, filters)
          if (rows.length === 0 && table === 'profiles' && filters.some(f => f.col === 'id')) {
            const idFilter = filters.find(f => f.col === 'id')
            const fallback = Object.values(demoAccounts).find(p => p.id === idFilter?.val)
            if (fallback) rows = [fallback]
          }
          return { data: rows.length > 0 ? rows[0] : null, error: rows.length === 0 ? { message: 'Not found' } : null }
        },
        then: (resolve: any) => {
          let rows = resolveJoins(queryTable(table, filters), table)
          if (orderDesc) rows.sort((a, b) => new Date(b[orderCol] || 0).getTime() - new Date(a[orderCol] || 0).getTime())
          else rows.sort((a, b) => new Date(a[orderCol] || 0).getTime() - new Date(b[orderCol] || 0).getTime())
          if (limitCount > 0) rows = rows.slice(0, limitCount)
          return resolve({ data: rows, error: null })
        },
      }

      const builder: any = {
        select: (_columns?: string) => queryMethods,
        insert: (values: any) => {
          const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + String(Math.random()).slice(2)
          const newItem = { id, ...values, created_at: new Date().toISOString() }
          if (!stores[table]) stores[table] = []
          stores[table].push(newItem)
          return {
            select: () => ({
              single: async () => ({ data: newItem, error: null }),
            }),
          }
        },
        update: (values: any) => {
          let updatedItem: any = null
          return {
            eq: (col: string, val: any) => {
              const store = getStore(table)
              const idx = store.findIndex((r: any) => r[col] === val)
              if (idx >= 0) {
                store[idx] = { ...store[idx], ...values }
                updatedItem = store[idx]
              }
              return {
                select: () => ({
                  single: async () => ({ data: updatedItem, error: updatedItem ? null : { message: 'Not found' } }),
                }),
              }
            },
          }
        },
        delete: () => ({
          eq: (col: string, val: any) => {
            const store = getStore(table)
            const idx = store.findIndex((r: any) => r[col] === val)
            if (idx >= 0) stores[table].splice(idx, 1)
            return { then: (resolve: any) => resolve({ data: null, error: null }) }
          },
        }),
      }
      return builder
    },
    rpc: (fn: string, params: any) => {
      if (fn === 'get_deepseek_api_key') return Promise.resolve({ data: import.meta.env.VITE_DEEPSEEK_API_KEY || null, error: null })
      if (fn === 'vault_upsert_secret') return Promise.resolve({ data: null, error: null })
      if (fn === 'get_class_grades') {
        const exams = getStore('exams')
        const results = getStore('exam_results')
        const students = profilesStore
        const studentRows = students.map(s => {
          const scores = exams.map((e: any) => {
            const r = results.find((r: any) => r.exam_id === e.id && r.student_id === s.id)
            return { exam: e.title, score: r?.score ?? null }
          })
          const validScores = scores.filter(s => s.score !== null).map(s => s.score)
          const avg = validScores.length > 0 ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length) : 0
          return { student_id: s.id, nickname: s.nickname, scores, avg }
        })
        return Promise.resolve({ data: studentRows, error: null })
      }
      return Promise.resolve({ data: [], error: null })
    },
    channel: () => ({ on: () => ({ subscribe: () => { } }) }),
    removeChannel: () => { },
  }
}

export const supabase = isDemo ? createMockClient() as any : createClient(supabaseUrl, supabaseAnonKey)
