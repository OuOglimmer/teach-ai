-- =============================================
-- AI 教学工作台 - 完整数据库 Schema
-- 学校: AI启航教育 / 成都市第九百九十九中学
-- =============================================

-- 1. 扩展用户档案表 (关联 auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  school TEXT DEFAULT 'AI启航教育',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 班级表
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 班级-学生关联
CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id)
);

-- 4. 班级-教师关联
CREATE TABLE public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  UNIQUE(class_id, teacher_id, subject)
);

-- 5. 学科表
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL
);

-- 6. AI 对话记录
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT '新对话',
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  subject TEXT DEFAULT '数学',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 学习建议
CREATE TABLE public.learning_suggestions (
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
CREATE TABLE public.practice_exercises (
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

-- 9. 作业
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  total_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 考试
CREATE TABLE public.exams (
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

-- 11. 考试成绩
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score REAL,
  answers JSONB DEFAULT '{}'::jsonb,
  graded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- 12. 教学资源
CREATE TABLE public.resources (
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

-- 13. 班级统计快照
CREATE TABLE public.class_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  avg_score REAL,
  student_count INTEGER,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT '{}'::jsonb
);

-- ========== 索引 ==========
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_conversations_updated ON public.ai_conversations(updated_at DESC);
CREATE INDEX idx_suggestions_student ON public.learning_suggestions(student_id);
CREATE INDEX idx_practice_student ON public.practice_exercises(student_id);
CREATE INDEX idx_exams_class ON public.exams(class_id);
CREATE INDEX idx_exam_results_exam ON public.exam_results(exam_id);
CREATE INDEX idx_exam_results_student ON public.exam_results(student_id);
CREATE INDEX idx_resources_subject ON public.resources(subject, grade);
CREATE INDEX idx_class_stats_date ON public.class_stats(date DESC);

-- ========== 自动创建档案触发器 ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RLS 行级安全策略 ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_stats ENABLE ROW LEVEL SECURITY;

-- Profiles: 每个人可看自己, admin看全部
CREATE POLICY "profiles_self" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Classes: admin/teacher 可读写, student 只读
CREATE POLICY "classes_select" ON public.classes
  FOR SELECT USING (true);
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );
CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AI 对话: 每个人只能看自己的
CREATE POLICY "conversations_self" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid());

-- 学习建议: 学生看自己的, 教师看自己班级的
CREATE POLICY "suggestions_select" ON public.learning_suggestions
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.class_teachers WHERE teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 练习: 学生看自己的
CREATE POLICY "practice_self" ON public.practice_exercises
  FOR ALL USING (student_id = auth.uid());

-- 考试结果: 学生看自己的, 教师看班级的
CREATE POLICY "exam_results_select" ON public.exam_results
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.exams e JOIN public.class_teachers ct ON e.class_id = ct.class_id WHERE e.id = exam_id AND ct.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 资源: 所有人可读, admin/teacher 可上传
CREATE POLICY "resources_select" ON public.resources
  FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON public.resources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );
