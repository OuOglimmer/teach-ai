export type Role = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  role: Role
  school: string
  created_at: string
}

export interface Class {
  id: string
  name: string
  grade: string
  created_by: string
  created_at: string
}

export interface ClassStudent {
  id: string
  class_id: string
  student_id: string
  student?: Profile
}

export interface Subject {
  id: string
  name: string
  grade: string
}

export interface AiConversation {
  id: string
  user_id: string
  title: string
  messages: Message[]
  status: 'active' | 'resolved'
  subject: string
  created_at: string
  updated_at: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface LearningSuggestion {
  id: string
  student_id: string
  subject: string
  weak_points: string[]
  suggestions: string[]
  exam_analysis: string
  homework_completion: number
  created_at: string
}

export interface PracticeExercise {
  id: string
  student_id: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  topics: string[]
  questions: Question[]
  total_score: number
  estimated_time: number
  created_at: string
}

export interface Question {
  id: string
  type: 'choice' | 'fill' | 'essay'
  content: string
  options?: string[]
  answer: string
  score: number
}

export interface Assignment {
  id: string
  class_id: string
  teacher_id: string
  title: string
  description: string
  due_date: string
  total_score: number
  created_at: string
}

export interface Exam {
  id: string
  class_id: string
  teacher_id: string
  title: string
  duration: number
  total_score: number
  questions: Question[]
  start_time: string
  end_time: string
  status: 'draft' | 'published' | 'grading' | 'done'
  created_at: string
}

export interface ExamResult {
  id: string
  exam_id: string
  student_id: string
  score: number
  answers: Record<string, string>
  graded: boolean
  submitted_at: string
}

export interface Resource {
  id: string
  title: string
  type: 'courseware' | 'video' | 'exercise' | 'lesson_plan'
  subject: string
  grade: string
  url: string
  tags: string[]
  uploaded_by: string
  created_at: string
}

export interface ClassStats {
  class_id: string
  class_name: string
  avg_score: number
  student_count: number
  weak_topics: string[]
  trend: { date: string; avg: number }[]
}

export interface RegistrationApproval {
  id: string
  email: string
  nickname: string
  role: 'teacher' | 'admin'
  school: string
  status: 'pending' | 'approved' | 'rejected'
  handled_by: string | null
  created_at: string
}

export interface PendingRegistration {
  id: string
  email: string
  nickname: string
  role: 'teacher' | 'admin'
  school: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Homework {
  id: string
  class_id: string
  teacher_id: string
  title: string
  description: string
  due_date: string
  total_score: number
  status: 'draft' | 'published' | 'closed'
  created_at: string
}

export interface HomeworkSubmission {
  id: string
  homework_id: string
  student_id: string
  content: string
  score: number | null
  graded: boolean
  submitted_at: string
}
