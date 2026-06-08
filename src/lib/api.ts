import { supabase } from './supabase'
import type {
  Profile, AiConversation, LearningSuggestion, PracticeExercise,
  Exam, ExamResult, Resource, Class, ClassStats,
  RegistrationApproval, Homework, HomeworkSubmission, Test
} from '@/types'

export const api = {
  // ========== Auth ==========
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, role: string = 'student') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } }
    })
    if (error) throw error
    return data
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  // ========== Profile ==========
  async getProfile(id: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ========== AI Conversations ==========
  async getConversations(userId: string): Promise<AiConversation[]> {
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    return data || []
  },

  async createConversation(conv: Partial<AiConversation>) {
    const { data, error } = await supabase.from('ai_conversations').insert(conv).select().single()
    if (error) throw error
    return data
  },

  async updateConversation(id: string, updates: Partial<AiConversation>) {
    const { data, error } = await supabase.from('ai_conversations').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async deleteConversation(id: string) {
    await supabase.from('ai_conversations').delete().eq('id', id)
  },

  // ========== Learning Suggestions ==========
  async getSuggestions(studentId: string): Promise<LearningSuggestion[]> {
    const { data } = await supabase
      .from('learning_suggestions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    return data || []
  },

  async createSuggestion(s: Partial<LearningSuggestion>) {
    const { data, error } = await supabase.from('learning_suggestions').insert(s).select().single()
    if (error) throw error
    return data
  },

  // ========== Practice Exercises ==========
  async getPracticeExercises(studentId: string): Promise<PracticeExercise[]> {
    const { data } = await supabase
      .from('practice_exercises')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    return data || []
  },

  async createPracticeExercise(ex: Partial<PracticeExercise>) {
    const { data, error } = await supabase.from('practice_exercises').insert(ex).select().single()
    if (error) throw error
    return data
  },

  // ========== Classes ==========
  async getClasses(): Promise<Class[]> {
    const { data } = await supabase.from('classes').select('*').order('name')
    return data || []
  },

  async createClass(c: Partial<Class>) {
    const { data, error } = await supabase.from('classes').insert(c).select().single()
    if (error) throw error
    return data
  },

  // ========== Exams ==========
  async getExams(classId?: string): Promise<Exam[]> {
    let query = supabase.from('exams').select('*, class:classes(name)')
    if (classId) query = query.eq('class_id', classId)
    const { data } = await query.order('created_at', { ascending: false })
    return data || []
  },

  async createExam(exam: Partial<Exam>) {
    const { data, error } = await supabase.from('exams').insert(exam).select().single()
    if (error) throw error
    return data
  },

  async updateExam(id: string, updates: Partial<Exam>) {
    const { data, error } = await supabase.from('exams').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ========== Exam Results ==========
  async getExamResults(examId: string): Promise<ExamResult[]> {
    const { data } = await supabase
      .from('exam_results')
      .select('*, student:profiles(nickname, email)')
      .eq('exam_id', examId)
    return data || []
  },

  // ========== Resources ==========
  async getResources(filters?: { subject?: string; grade?: string; type?: string }): Promise<Resource[]> {
    let query = supabase.from('resources').select('*')
    if (filters?.subject) query = query.eq('subject', filters.subject)
    if (filters?.grade) query = query.eq('grade', filters.grade)
    if (filters?.type) query = query.eq('type', filters.type)
    const { data } = await query.order('created_at', { ascending: false })
    return data || []
  },

  // ========== Class Stats ==========
  async getClassStats(classId: string): Promise<ClassStats[]> {
    const { data } = await supabase
      .from('class_stats')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false })
      .limit(30)
    return data || []
  },

  // ========== Registration Approvals ==========
  async createRegistrationApproval(reg: Partial<RegistrationApproval>) {
    const { data, error } = await supabase.from('registration_approvals').insert(reg).select().single()
    if (error) throw error
    return data
  },

  async getPendingRegistrations(): Promise<RegistrationApproval[]> {
    const { data } = await supabase
      .from('registration_approvals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return data || []
  },

  async getAllRegistrations(): Promise<RegistrationApproval[]> {
    const { data } = await supabase
      .from('registration_approvals')
      .select('*')
      .order('created_at', { ascending: false })
    return data || []
  },

  async handleRegistration(id: string, status: 'approved' | 'rejected', handledBy: string) {
    const { data, error } = await supabase
      .from('registration_approvals')
      .update({ status, handled_by: handledBy })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ========== Homework ==========
  async getHomework(classId?: string): Promise<Homework[]> {
    let query = supabase.from('homework').select('*, class:classes(name)')
    if (classId) query = query.eq('class_id', classId)
    const { data } = await query.order('created_at', { ascending: false })
    return data || []
  },

  async createHomework(hw: Partial<Homework>) {
    const { data, error } = await supabase.from('homework').insert(hw).select().single()
    if (error) throw error
    return data
  },

  async updateHomeworkStatus(id: string, status: 'draft' | 'published' | 'closed') {
    const { data, error } = await supabase.from('homework').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async submitHomework(sub: Partial<HomeworkSubmission>) {
    const { data, error } = await supabase.from('homework_submissions').insert(sub).select().single()
    if (error) throw error
    return data
  },

  async getHomeworkSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
    const { data } = await supabase
      .from('homework_submissions')
      .select('*, student:profiles(nickname, email)')
      .eq('homework_id', homeworkId)
    return data || []
  },

  async gradeSubmission(id: string, score: number) {
    const { data, error } = await supabase
      .from('homework_submissions')
      .update({ score, graded: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ========== Class Students ==========
  async getClassStudents(classId: string): Promise<{ id: string; student_id: string; student?: Profile }[]> {
    const { data } = await supabase
      .from('class_students')
      .select('*, student:profiles(nickname, email, id)')
      .eq('class_id', classId)
    return data || []
  },

  async addStudentToClass(classId: string, studentId: string) {
    const { data, error } = await supabase
      .from('class_students')
      .insert({ class_id: classId, student_id: studentId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeStudentFromClass(id: string) {
    await supabase.from('class_students').delete().eq('id', id)
  },

  // ========== Grades ==========
  async getStudentGrades(studentId: string): Promise<{ exam_title: string; score: number; total: number; date: string }[]> {
    const { data } = await supabase
      .from('exam_results')
      .select('score, exam:exams(title, total_score, start_time)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
    return data?.map((r: any) => ({
      exam_title: r.exam?.title || '',
      score: r.score,
      total: r.exam?.total_score || 100,
      date: r.exam?.start_time || ''
    })) || []
  },

  async getClassGrades(classId: string): Promise<{ student_id: string; nickname: string; scores: { exam: string; score: number }[]; avg: number }[]> {
    const { data } = await supabase.rpc('get_class_grades', { p_class_id: classId })
    return data || []
  },

  // ========== Tests ==========
  async getTests(classId?: string): Promise<Test[]> {
    let query = supabase.from('tests').select('*, class:classes(name)')
    if (classId) query = query.eq('class_id', classId)
    const { data } = await query.order('created_at', { ascending: false })
    return data || []
  },

  async createTest(test: Partial<Test>) {
    const { data, error } = await supabase.from('tests').insert(test).select().single()
    if (error) throw error
    return data
  },

  async updateTest(id: string, updates: Partial<Test>) {
    const { data, error } = await supabase.from('tests').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async deleteTest(id: string) {
    await supabase.from('tests').delete().eq('id', id)
  },

  // ========== Vault Secrets ==========
  async getVaultSecret(name: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('vault_get_secret', { p_name: name })
    if (error || !data) return null
    return data
  },

  async saveVaultSecret(name: string, value: string) {
    const { error } = await supabase.rpc('vault_upsert_secret', { p_name: name, p_value: value })
    if (error) throw error
  },

  // ========== RPC 复杂查询 ==========
  async getStudentRanking(examId: string): Promise<{ student_id: string; nickname: string; score: number; rank: number }[]> {
    const { data } = await supabase.rpc('get_exam_ranking', { p_exam_id: examId })
    return data || []
  },

  async getWeakTopics(classId: string): Promise<{ topic: string; error_rate: number }[]> {
    const { data } = await supabase.rpc('get_weak_topics', { p_class_id: classId })
    return data || []
  }
}
