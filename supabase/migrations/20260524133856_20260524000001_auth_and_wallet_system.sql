/*
  # Auth Integration, Wallet System, and Session Management

  1. New Tables
    - `chat_sessions` - Track user chat sessions with timestamps
    - `transactions` - Wallet transactions (deposits, escrow, earnings)
    - `notifications` - User notification system
    - `sample_gig_templates` - Templates for auto-generated sample gigs
    - `scheduled_jobs` - Track background job execution

  2. Modified Tables
    - `user_profiles` - Add auth_user_id link, wallet balance columns
    - `chat_messages` - Add session_id foreign key

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to access their own data only

  4. Important Notes
    - auth_user_id links to Supabase auth.users for authentication
    - Balance columns track virtual wallet for simulated payments
    - Sessions enable chat recall with timeline persistence
*/

-- Link user_profiles to Supabase Auth
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'auth_user_id') THEN
    ALTER TABLE user_profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint using DO block
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_auth_user_id') THEN
    ALTER TABLE user_profiles ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);
  END IF;
END $$;

-- Add wallet/balance system to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'balance') THEN
    ALTER TABLE user_profiles ADD COLUMN balance DECIMAL(10,2) DEFAULT 100.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_earned') THEN
    ALTER TABLE user_profiles ADD COLUMN total_earned DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_spent') THEN
    ALTER TABLE user_profiles ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
    ALTER TABLE user_profiles ADD COLUMN email TEXT DEFAULT '';
  END IF;
END $$;

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  session_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

-- Add session_id to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'session_id') THEN
    ALTER TABLE chat_messages ADD COLUMN session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'earning', 'refund')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('gig', 'match', 'deposit')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT user_id FROM user_profiles WHERE auth_user_id = auth.uid()));

-- Sample Gig Templates for auto-generation
CREATE TABLE IF NOT EXISTS sample_gig_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  pay_min DECIMAL(10,2),
  pay_max DECIMAL(10,2),
  location_options TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true
);

-- Scheduled Jobs Table
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  config JSONB DEFAULT '{}'
);

-- Add completion tracking to gigs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'accepted_by_user_id') THEN
    ALTER TABLE gigs ADD COLUMN accepted_by_user_id UUID REFERENCES user_profiles(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'accepted_by_name') THEN
    ALTER TABLE gigs ADD COLUMN accepted_by_name TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'started_at') THEN
    ALTER TABLE gigs ADD COLUMN started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'completed_at') THEN
    ALTER TABLE gigs ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'contractor_marked_complete') THEN
    ALTER TABLE gigs ADD COLUMN contractor_marked_complete BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gigs' AND column_name = 'redeems_requested') THEN
    ALTER TABLE gigs ADD COLUMN redeems_requested INTEGER DEFAULT 0;
  END IF;
END $$;

-- Modify gig_matches to track contractor acceptance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gig_matches' AND column_name = 'contractor_accepted') THEN
    ALTER TABLE gig_matches ADD COLUMN contractor_accepted BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gig_matches' AND column_name = 'contractor_accepted_at') THEN
    ALTER TABLE gig_matches ADD COLUMN contractor_accepted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Insert default sample gig templates
INSERT INTO sample_gig_templates (category, title_template, description_template, pay_min, pay_max, location_options, skills_required) VALUES
('Tutoring', 'Need Math Tutor', 'Looking for someone to help with calculus. Session should be about 1 hour.', 25.00, 45.00, ARRAY['Library', 'Student Union', 'Coffee Shop', 'East Hall', 'West Campus'], ARRAY['Tutoring', 'Teaching', 'Math']),
('Tech Support', 'Help with Laptop Setup', 'Need assistance setting up new laptop and configuring software. Should take about 30 minutes.', 30.00, 60.00, ARRAY['Dorm Room', 'Library', 'Tech Center', 'Engineering Quad'], ARRAY['Tech Support', 'Computer Skills']),
('Furniture Assembly & Moving', 'Moving Help Needed', 'Moving some furniture from dorm to apartment. Approximately 5 large items.', 35.00, 75.00, ARRAY['East Hall', 'North Campus', 'South Dorms', 'West Campus'], ARRAY['Moving', 'Heavy Lifting']),
('Design & Creative', 'Logo Design Project', 'Creating a logo design for student club. Need someone creative with Illustrator.', 40.00, 100.00, ARRAY['Remote', 'Design Studio', 'Coffee Shop'], ARRAY['Design', 'Creative', 'Art']),
('Photography', 'Event Photography', 'Need photos for birthday party. Duration approximately 2 hours.', 50.00, 150.00, ARRAY['Student Union', 'Sports Complex', 'Outdoor Campus', 'Event Hall'], ARRAY['Photography', 'Events']),
('Writing & Editing', 'Essay Editing Help', 'Need someone to review and edit research paper. Approximately 2000 words.', 20.00, 50.00, ARRAY['Library', 'Remote', 'Coffee Shop'], ARRAY['Writing', 'Editing', 'English']),
('Errands & Delivery', 'Pick up and Deliver Books', 'Need someone to pick up textbooks from bookstore and deliver to dorm.', 15.00, 35.00, ARRAY['Student Union', 'Downtown', 'Campus Store', 'Off-campus'], ARRAY['Errands', 'Delivery']),
('Music & Audio', 'Guitar Lessons', 'Looking for guitar lessons. Beginner level.', 30.00, 60.00, ARRAY['Music Building', 'Practice Rooms', 'Dorm Room'], ARRAY['Music', 'Teaching', 'Guitar']),
('Fitness & Sports', 'Gym Training Partner', 'Need a training partner for weightlifting. 3 sessions per week.', 20.00, 40.00, ARRAY['Gym', 'Sports Complex', 'Outdoor Track', 'Pool'], ARRAY['Fitness', 'Sports', 'Training']),
('Cooking & Food', 'Meal Prep Help', 'Need help with meal prep for the week. 7 meals.', 40.00, 80.00, ARRAY['Dorm Kitchen', 'Apartment', 'Community Kitchen'], ARRAY['Cooking', 'Meal Prep'])
ON CONFLICT DO NOTHING;
