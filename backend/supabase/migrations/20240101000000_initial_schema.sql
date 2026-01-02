-- ============================================
-- FitnessBro Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- EXERCISES (global, read-only for users)
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'cardio')),
  equipment TEXT NOT NULL CHECK (equipment IN ('barbell', 'dumbbell', 'bodyweight', 'cable', 'machine', 'kettlebell', 'bands')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  target_muscles TEXT[] DEFAULT '{}',
  equipment_details TEXT[] DEFAULT '{}',
  icon_color TEXT DEFAULT 'bg-blue-100 text-blue-600',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXERCISE TIPS
-- ============================================
CREATE TABLE exercise_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_tips_exercise ON exercise_tips(exercise_id);

-- ============================================
-- PROGRAMS (user-owned)
-- ============================================
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INT DEFAULT 4 CHECK (duration_weeks > 0),
  days_per_week INT DEFAULT 3 CHECK (days_per_week > 0 AND days_per_week <= 7),
  type TEXT DEFAULT 'Custom',
  icon_type TEXT DEFAULT 'grid' CHECK (icon_type IN ('grid', 'refresh', 'run')),
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programs_user ON programs(user_id);
CREATE INDEX idx_programs_active ON programs(user_id, is_active);

-- Only one active program per user
CREATE UNIQUE INDEX idx_programs_single_active ON programs(user_id) WHERE is_active = TRUE;

-- ============================================
-- WORKOUT DAYS (within programs)
-- ============================================
CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number > 0),
  name TEXT NOT NULL,
  muscle_groups TEXT,
  estimated_duration INT DEFAULT 45 CHECK (estimated_duration > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_days_program ON workout_days(program_id);

-- ============================================
-- PROGRAM EXERCISES (exercises in a workout day)
-- ============================================
CREATE TABLE program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  sets INT DEFAULT 3 CHECK (sets > 0),
  reps TEXT DEFAULT '10',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_program_exercises_day ON program_exercises(workout_day_id);

-- ============================================
-- WORKOUT SESSIONS (completed workouts)
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_volume DECIMAL(10,2) DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(user_id, started_at DESC);

-- ============================================
-- WORKOUT SETS (individual set records)
-- ============================================
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number INT NOT NULL CHECK (set_number > 0),
  weight DECIMAL(6,2) CHECK (weight >= 0),
  reps INT CHECK (reps >= 0),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sets_session ON workout_sets(session_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Exercises (public read)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are viewable by everyone"
  ON exercises FOR SELECT
  USING (true);

-- Exercise Tips (public read)
ALTER TABLE exercise_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercise tips are viewable by everyone"
  ON exercise_tips FOR SELECT
  USING (true);

-- Programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own programs"
  ON programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own programs"
  ON programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs"
  ON programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own programs"
  ON programs FOR DELETE
  USING (auth.uid() = user_id);

-- Workout Days
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access days of own programs"
  ON workout_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = workout_days.program_id
      AND programs.user_id = auth.uid()
    )
  );

-- Program Exercises
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access exercises of own programs"
  ON program_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN programs p ON p.id = wd.program_id
      WHERE wd.id = program_exercises.workout_day_id
      AND p.user_id = auth.uid()
    )
  );

-- Workout Sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Workout Sets
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access sets of own sessions"
  ON workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_sets.session_id
      AND ws.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to deactivate other programs when activating one
CREATE OR REPLACE FUNCTION deactivate_other_programs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE programs
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_program_activate
  BEFORE UPDATE OF is_active ON programs
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION deactivate_other_programs();

-- Function to calculate weekly volume
CREATE OR REPLACE FUNCTION get_weekly_volume(p_user_id UUID, p_weeks INT DEFAULT 1)
RETURNS TABLE (
  day_of_week TEXT,
  total_volume DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(ws.started_at, 'Dy') as day_of_week,
    COALESCE(SUM(wset.weight * wset.reps), 0)::DECIMAL as total_volume
  FROM workout_sessions ws
  LEFT JOIN workout_sets wset ON wset.session_id = ws.id AND wset.completed = TRUE
  WHERE ws.user_id = p_user_id
  AND ws.started_at >= NOW() - (p_weeks || ' weeks')::INTERVAL
  GROUP BY TO_CHAR(ws.started_at, 'Dy'), EXTRACT(DOW FROM ws.started_at)
  ORDER BY EXTRACT(DOW FROM ws.started_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
