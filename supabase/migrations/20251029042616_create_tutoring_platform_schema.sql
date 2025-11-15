/*
  # Peer-to-Peer Tutoring Platform Schema

  ## Overview
  Creates the complete database schema for a tutoring platform with students, tutors, sessions, and reviews.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - Either 'tutor' or 'learner'
  - `created_at` (timestamptz) - Account creation time
  - `updated_at` (timestamptz) - Last profile update
  
  ### `tutor_profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles.id
  - `bio` (text) - Tutor biography
  - `skills` (text array) - List of subjects/skills
  - `hourly_rate` (numeric) - Price per hour
  - `rating` (numeric) - Average rating (0-5)
  - `total_reviews` (integer) - Number of reviews received
  - `availability` (jsonb) - Available time slots
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `sessions`
  - `id` (uuid, primary key)
  - `tutor_id` (uuid) - References profiles.id
  - `learner_id` (uuid) - References profiles.id
  - `subject` (text) - Session subject/topic
  - `session_type` (text) - '1-on-1' or 'group'
  - `scheduled_at` (timestamptz) - Session start time
  - `duration_minutes` (integer) - Session duration
  - `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
  - `meeting_link` (text) - Video call link (optional)
  - `notes` (text) - Session notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `reviews`
  - `id` (uuid, primary key)
  - `session_id` (uuid) - References sessions.id
  - `tutor_id` (uuid) - References profiles.id
  - `learner_id` (uuid) - References profiles.id
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review text
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Profiles: Users can read all profiles, update only their own
  - Tutor Profiles: Everyone can read, only tutors can update their own
  - Sessions: Participants can read/update their sessions, anyone authenticated can create
  - Reviews: Everyone can read, only session participants can create
  
  ## 3. Indexes
  - Index on tutor_profiles for searching by skills and rating
  - Index on sessions for filtering by tutor, learner, and status
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('tutor', 'learner')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create tutor_profiles table
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text DEFAULT '',
  skills text[] DEFAULT ARRAY[]::text[],
  hourly_rate numeric DEFAULT 0,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  availability jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tutor profiles"
  ON tutor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tutors can insert own profile"
  ON tutor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_id 
      AND profiles.role = 'tutor'
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update own profile"
  ON tutor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('1-on-1', 'group')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id OR auth.uid() = learner_id);

CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Participants can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_id OR auth.uid() = learner_id)
  WITH CHECK (auth.uid() = tutor_id OR auth.uid() = learner_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, learner_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Learners can create reviews for their sessions"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = learner_id AND
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_id 
      AND sessions.learner_id = auth.uid()
      AND sessions.status = 'completed'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_skills ON tutor_profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_rating ON tutor_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_tutor ON sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews(tutor_id);

-- Function to update tutor rating after review
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id
    ),
    updated_at = now()
  WHERE user_id = NEW.tutor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update tutor rating
DROP TRIGGER IF EXISTS trigger_update_tutor_rating ON reviews;
CREATE TRIGGER trigger_update_tutor_rating
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_rating();