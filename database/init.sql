-- =============================================
-- AI 教学工作台 - Supabase 完整建表脚本
-- 说明：在 Supabase Dashboard > SQL Editor 中执行
-- =============================================

-- 0. 启用扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== 建表 ====================

-- 1. 用户档案（auth.users 的扩展表，触发器自动创建）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  school TEXT DEFAULT 'AI启航教育',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 班级
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 班级-学生关联
CREATE TABLE IF NOT EXISTS public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id)
);

-- 4. 班级-教师关联
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  UNIQUE(class_id, teacher_id, subject)
);

-- 5. 学科
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL
);

-- 6. AI对话记录（用户隔离：每人只能看自己的）
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT '新对话',
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  subject TEXT DEFAULT '综合',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 学习建议
CREATE TABLE IF NOT EXISTS public.learning_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  weak_points JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  exam_analysis TEXT,
  homework_completion REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 个性化练习
CREATE TABLE IF NOT EXISTS public.practice_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topics JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  total_score INTEGER DEFAULT 100,
  estimated_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 考试
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  duration INTEGER DEFAULT 120,
  total_score INTEGER DEFAULT 100,
  questions JSONB DEFAULT '[]'::jsonb,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'grading', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 考试成绩
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score REAL,
  answers JSONB DEFAULT '{}'::jsonb,
  graded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- 11. 考试场次记录
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'standard' CHECK (exam_type IN ('standard', 'quiz', 'midterm', 'final', 'mock')),
  duration INTEGER DEFAULT 120,
  total_score INTEGER DEFAULT 100,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'grading', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. 作业
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ,
  total_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. 作业提交
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  score REAL,
  graded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 14. 教学资源
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('courseware', 'video', 'exercise', 'lesson_plan')),
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. 注册审批
CREATE TABLE IF NOT EXISTS public.registration_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'admin')),
  school TEXT DEFAULT 'AI启航教育',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  handled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. 班级统计快照
CREATE TABLE IF NOT EXISTS public.class_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  avg_score REAL,
  student_count INTEGER,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT '{}'::jsonb
);

-- ==================== 索引 ====================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_student ON public.learning_suggestions(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_student ON public.practice_exercises(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON public.exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject, grade);
CREATE INDEX IF NOT EXISTS idx_class_stats_date ON public.class_stats(date DESC);

-- ==================== 自动创建档案 ====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== RLS 行级安全 ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_stats ENABLE ROW LEVEL SECURITY;

-- 1. Profiles：自己看自己/改自己，admin 看全部，触发器处理插入
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Classes：所有人可读，admin/teacher 可写
CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (true);
CREATE POLICY "classes_insert" ON public.classes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "classes_update" ON public.classes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. AI 对话：每人只能看/改自己的
CREATE POLICY "conversations_self" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid());

-- 4. 学习建议：学生看自己的，教师/admin 看全部
CREATE POLICY "suggestions_select" ON public.learning_suggestions
  FOR SELECT USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- 5. 练习：每人看自己的
CREATE POLICY "practice_self" ON public.practice_exercises
  FOR ALL USING (student_id = auth.uid());

-- 6. 考试（教师/admin 可管理）
CREATE POLICY "exams_select" ON public.exams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "exams_insert" ON public.exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "exams_update" ON public.exams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 7. 考试结果：学生看自己的，教师/admin 看全部
CREATE POLICY "exam_results_select" ON public.exam_results
  FOR SELECT USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 8. 作业
CREATE POLICY "homework_select" ON public.homework FOR SELECT USING (true);
CREATE POLICY "homework_insert" ON public.homework FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "homework_update" ON public.homework FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 9. 作业提交
CREATE POLICY "homework_submissions_select" ON public.homework_submissions
  FOR SELECT USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "homework_submissions_insert" ON public.homework_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "homework_submissions_update" ON public.homework_submissions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 10. 资源：所有人可读，admin/teacher 可上传
CREATE POLICY "resources_select" ON public.resources FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON public.resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 11. 注册审批：admin 可管理
CREATE POLICY "registration_approvals_insert" ON public.registration_approvals
  FOR INSERT WITH CHECK (true);
CREATE POLICY "registration_approvals_select" ON public.registration_approvals
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "registration_approvals_update" ON public.registration_approvals
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 12. class_stats 统计表
CREATE POLICY "class_stats_select" ON public.class_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 13. test 表
CREATE POLICY "tests_select" ON public.tests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "tests_insert" ON public.tests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "tests_update" ON public.tests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "tests_delete" ON public.tests FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- ==================== RPC 函数 ====================

-- 班级成绩查询
CREATE OR REPLACE FUNCTION public.get_class_grades(p_class_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', cs.student_id,
      'nickname', p.nickname,
      'scores', (
        SELECT jsonb_agg(
          jsonb_build_object('exam', e.title, 'score', er.score)
        )
        FROM public.exams e
        LEFT JOIN public.exam_results er ON er.exam_id = e.id AND er.student_id = cs.student_id
        WHERE e.class_id = p_class_id
      ),
      'avg', COALESCE((
        SELECT ROUND(AVG(er.score)) FROM public.exam_results er
        JOIN public.exams e ON e.id = er.exam_id AND e.class_id = p_class_id
        WHERE er.student_id = cs.student_id AND er.score IS NOT NULL
      ), 0)
    )
  ) INTO result
  FROM public.class_students cs
  JOIN public.profiles p ON p.id = cs.student_id
  WHERE cs.class_id = p_class_id;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 考试排名
CREATE OR REPLACE FUNCTION public.get_exam_ranking(p_exam_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', er.student_id,
      'nickname', p.nickname,
      'score', er.score,
      'rank', row_number() OVER (ORDER BY er.score DESC)
    )
  ) INTO result
  FROM public.exam_results er
  JOIN public.profiles p ON p.id = er.student_id
  WHERE er.exam_id = p_exam_id AND er.score IS NOT NULL
  ORDER BY er.score DESC;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ==================== 授权 ====================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_grades TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_ranking TO authenticated;
