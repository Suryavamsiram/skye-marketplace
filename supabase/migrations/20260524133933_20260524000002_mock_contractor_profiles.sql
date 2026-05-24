/*
  # Mock Contractor Profiles for Testing

  1. Purpose
    - Create diverse contractor profiles for demo/testing
    - Each profile has unique skills, interests, and availability
    - Includes auth credentials for "Login as this Profile" feature

  2. Profile Categories
    - Tech/AI enthusiasts
    - Fitness & Sports lovers
    - Creative & Design focused
    - Academic & Tutoring specialists
    - Music & Audio professionals
    - Culinary & Lifestyle helpers

  3. Important Notes
    - These are pre-seeded demo profiles
    - Password will be standardized (stored in code comments)
    - All profiles start with $100 balance for testing
*/

-- Function to create contractor profile with auth
CREATE OR REPLACE FUNCTION create_contractor_profile(
  p_name TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'both',
  p_campus_location TEXT DEFAULT 'Student Union',
  p_skills TEXT[] DEFAULT '{}',
  p_bio TEXT DEFAULT '',
  p_availability TEXT DEFAULT 'flexible',
  p_pay_min DECIMAL DEFAULT 15,
  p_pay_max DECIMAL DEFAULT 50
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Generate user_id
  v_user_id := gen_random_uuid();
  
  -- Insert profile
  INSERT INTO user_profiles (
    user_id, name, email, role, campus_location, skills_interests, skills,
    bio, availability, pay_min, pay_max, balance, onboarding_complete
  ) VALUES (
    v_user_id, p_name, p_email, p_role, p_campus_location, p_skills, p_skills,
    p_bio, p_availability, p_pay_min, p_pay_max, 100.00, true
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Mock Contractor Profiles
SELECT create_contractor_profile(
  'Alex Chen',
  'alex.chen@demo.edu',
  'both',
  'Engineering Quad',
  ARRAY['Tech Support', 'Computer Skills', 'AI/ML', 'Web Development', 'Python'],
  'CS major specializing in machine learning. Love helping with tech setups and coding projects.',
  'evenings',
  30,
  80
);

SELECT create_contractor_profile(
  'Maya Patel',
  'maya.patel@demo.edu',
  'both',
  'Student Union',
  ARRAY['Tutoring', 'Math', 'Physics', 'Teaching', 'Study Help'],
  'Physics grad student. Patient tutor who makes complex concepts simple.',
  'afternoons',
  25,
  55
);

SELECT create_contractor_profile(
  'Jordan Smith',
  'jordan.smith@demo.edu',
  'both',
  'Gym',
  ARRAY['Fitness', 'Sports', 'Training', 'Nutrition', 'Weightlifting'],
  'Athletic training enthusiast. Can help with workouts, meal plans, and sports skills.',
  'mornings',
  20,
  45
);

SELECT create_contractor_profile(
  'Liam Torres',
  'liam.torres@demo.edu',
  'both',
  'Music Building',
  ARRAY['Music', 'Guitar', 'Piano', 'Audio Production', 'Teaching'],
  'Music producer and multi-instrumentalist. Teaching is my passion.',
  'flexible',
  30,
  70
);

SELECT create_contractor_profile(
  'Priya Rao',
  'priya.rao@demo.edu',
  'both',
  'Design Studio',
  ARRAY['Design', 'Creative', 'Art', 'Illustration', 'Graphic Design'],
  'Art student with love for visual storytelling. Logo design and illustration expert.',
  'evenings',
  40,
  120
);

SELECT create_contractor_profile(
  'Sam Williams',
  'sam.williams@demo.edu',
  'both',
  'Library',
  ARRAY['Writing', 'Editing', 'English', 'Research', 'Proofreading'],
  'English literature major. Expert editor and research assistant.',
  'flexible',
  15,
  40
);

SELECT create_contractor_profile(
  'Nina Kowalski',
  'nina.kowalski@demo.edu',
  'both',
  'North Campus',
  ARRAY['Photography', 'Events', 'Videography', 'Social Media', 'Content Creation'],
  'Photography enthusiast capturing life moments. Event and portrait specialist.',
  'weekends_only',
  50,
  200
);

SELECT create_contractor_profile(
  'David Kim',
  'david.kim@demo.edu',
  'both',
  'Dorm Kitchen',
  ARRAY['Cooking', 'Meal Prep', 'Baking', 'Nutrition', 'Culinary'],
  'Self-taught chef who loves meal prep. Healthy, affordable, delicious.',
  'evenings',
  35,
  90
);

SELECT create_contractor_profile(
  'Emma Johnson',
  'emma.johnson@demo.edu',
  'both',
  'West Campus',
  ARRAY['Moving', 'Heavy Lifting', 'Furniture Assembly', 'Errands', 'Delivery'],
  'Strong and reliable. No job too big or small for hauling and assembly.',
  'weekends_only',
  25,
  70
);

SELECT create_contractor_profile(
  'Raj Patel',
  'raj.patel@demo.edu',
  'both',
  'Tech Center',
  ARRAY['Tech Support', 'Phone Setup', 'Smart Home', 'Gaming', 'Networking'],
  'Tech wizard. Smart home setups, gaming rigs, networking - you name it.',
  'afternoons',
  35,
  85
);

SELECT create_contractor_profile(
  'Sofia Martinez',
  'sofia.martinez@demo.edu',
  'both',
  'Coffee Shop',
  ARRAY['Language Learning', 'Spanish', 'Translation', 'Tutoring', 'Conversation Practice'],
  'Native Spanish speaker. Love helping people practice conversation and learn languages.',
  'flexible',
  20,
  50
);

SELECT create_contractor_profile(
  'Marcus Thompson',
  'marcus.thompson@demo.edu',
  'both',
  'Sports Complex',
  ARRAY['Sports', 'Basketball', 'Soccer', 'Training', 'Coaching'],
  'Former college athlete. Can coach basketball, soccer, or general fitness.',
  'mornings',
  25,
  60
);

SELECT create_contractor_profile(
  'Aisha Okonkwo',
  'aisha.okonkwo@demo.edu',
  'both',
  'East Hall',
  ARRAY['Organization', 'Cleaning', 'Decluttering', 'Interior Design', 'Styling'],
  'Professional organizer helping students maximize small spaces.',
  'weekends_only',
  30,
  65
);

SELECT create_contractor_profile(
  'Tyler Green',
  'tyler.green@demo.edu',
  'both',
  'Downtown',
  ARRAY['Errands', 'Delivery', 'Shopping', 'Pickup', 'Transportation'],
  'Have a car and know the city well. Quick errands and deliveries across town.',
  'flexible',
  15,
  40
);

SELECT create_contractor_profile(
  'Olivia Brown',
  'olivia.brown@demo.edu',
  'both',
  'Library',
  ARRAY['Math', 'Statistics', 'Data Analysis', 'Excel', 'Tutoring'],
  'Statistics major who lives in spreadsheets. Can help with data projects and math.',
  'afternoons',
  25,
  55
);

-- Create standardized auth users for each contractor profile
-- Note: In production, use proper Supabase auth. For demo, we use a simpler approach.

-- Update the profiles to have auth_user_id (will be created via Supabase Auth in the app)
-- For now, we'll create a lookup table for demo login

CREATE TABLE IF NOT EXISTS demo_credentials (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hint TEXT DEFAULT 'demo123'
);

-- Insert demo credentials
INSERT INTO demo_credentials (user_id, name, email, password_hint)
SELECT user_id, name, email, 'demo123'
FROM user_profiles
WHERE email LIKE '%@demo.edu';

-- Drop the helper function
DROP FUNCTION IF EXISTS create_contractor_profile( TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, DECIMAL, DECIMAL );
