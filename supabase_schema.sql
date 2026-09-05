-- ==========================================
-- BOOKKEEP-IT SUPABASE DATABASE SCHEMA SCRIPT
-- Copy and run this in your Supabase SQL Editor
-- ==========================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  student_id TEXT,
  program TEXT DEFAULT 'BS Accountancy',
  completed_lessons_count INT DEFAULT 0,
  total_quizzes_taken INT DEFAULT 0,
  average_quiz_score INT DEFAULT 0,
  study_hours NUMERIC DEFAULT 0,
  streak_days INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  instructor TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  description TEXT NOT NULL,
  total_lessons INT DEFAULT 0,
  completed_lessons INT DEFAULT 0,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  passing_score INT DEFAULT 75,
  duration_minutes INT DEFAULT 15,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZ SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT REFERENCES public.quizzes(id) ON DELETE CASCADE,
  quiz_title TEXT NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  total_questions INT NOT NULL,
  correct_answers_count INT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOWNLOADABLE MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  download_url TEXT NOT NULL,
  description TEXT NOT NULL,
  downloads_count INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VIDEO LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  description TEXT NOT NULL,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sender TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC READ ACCESS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- GRANT PERMISSIONS TO ANON AND AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ALLOW SELECT (READ) ACCESS
CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access to quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow public read access to videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to submissions" ON public.quiz_submissions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);

-- ALLOW INSERT / WRITE ACCESS
CREATE POLICY "Allow public insert to videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to videos" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to videos" ON public.videos FOR DELETE USING (true);

CREATE POLICY "Allow public insert to courses" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to courses" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to courses" ON public.courses FOR DELETE USING (true);

CREATE POLICY "Allow public insert to quizzes" ON public.quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to quizzes" ON public.quizzes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to quizzes" ON public.quizzes FOR DELETE USING (true);

CREATE POLICY "Allow public insert to materials" ON public.materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to materials" ON public.materials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to materials" ON public.materials FOR DELETE USING (true);

CREATE POLICY "Allow public insert to submissions" ON public.quiz_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to notifications" ON public.notifications FOR UPDATE USING (true);


