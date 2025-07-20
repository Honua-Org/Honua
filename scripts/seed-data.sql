-- First, we need to create auth users before we can create profiles
-- Note: In a real application, users would be created through Supabase Auth
-- For demo purposes, we'll insert sample profiles that can be linked to real auth users later

-- Insert sample profiles (these will be linked to real auth users when they sign up)
INSERT INTO profiles (id, username, full_name, avatar_url, bio, location, website, role, reputation) 
SELECT 
  auth.uid(),
  'demo_user_' || gen_random_uuid()::text,
  'Demo User',
  '/placeholder.svg?height=256&width=256',
  'Demo sustainability advocate',
  'Demo Location',
  'https://demo.com',
  'user',
  100
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- If no authenticated user, create some sample data that can be used for display
-- These won't have foreign key constraints since they're just for demo purposes

-- Remove posts without user associations - they will be created with proper user_id below



-- Insert sample users into auth.users (for local development)
INSERT INTO auth.users (id, email, encrypted_password) VALUES
('00000000-0000-0000-0000-000000000001', 'demo1@example.com', '$2a$10$K.0HwpzQh8T4/sUGJCP7W.2wgc8S8MLlrQQ7z6ceTrqO5zBK98/4C'), -- password: demo123
('00000000-0000-0000-0000-000000000002', 'demo2@example.com', '$2a$10$K.0HwpzQh8T4/sUGJCP7W.2wgc8S8MLlrQQ7z6ceTrqO5zBK98/4C') -- password: demo123
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding profiles
INSERT INTO profiles (id, username, full_name, avatar_url, bio, location, website, role, reputation) VALUES
('00000000-0000-0000-0000-000000000001', 'demo_user1', 'Demo User 1', '/placeholder.svg?height=256&width=256', 'Demo sustainability advocate', 'Demo Location', 'https://demo.com', 'user', 100),
('00000000-0000-0000-0000-000000000002', 'demo_user2', 'Demo User 2', '/placeholder.svg?height=256&width=256', 'Demo sustainability advocate', 'Demo Location', 'https://demo.com', 'user', 100)
ON CONFLICT (id) DO NOTHING;

-- Create demo posts with proper user associations
INSERT INTO posts (id, user_id, content, media_urls, location, sustainability_category, impact_score, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000001', 'Just installed 20 solar panels on our community center! 🌞 This will reduce our carbon footprint by 80% and save $3,000 annually. Small steps lead to big changes! #SolarEnergy #CommunityAction', '{"/placeholder.svg?height=400&width=600"}', 'Portland, Oregon', 'Solar Energy', 85, '2024-01-15 10:30:00+00'),
('650e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000002', 'Week 3 of our zero-waste challenge! Our family has reduced waste by 90% through composting, reusable containers, and mindful shopping. Who else is joining the movement? 🌱', '{"/placeholder.svg?height=300&width=400","/placeholder.svg?height=300&width=400"}', 'Austin, Texas', 'Waste Reduction', 72, '2024-01-15 08:15:00+00'),
('650e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000001', 'Exciting news! Our new wind turbine design is 40% more efficient than traditional models. This breakthrough could revolutionize renewable energy production. Read our full research paper in the comments 👇', '{"/placeholder.svg?height=500&width=700"}', 'Copenhagen, Denmark', 'Wind Power', 95, '2024-01-14 16:45:00+00'),
('650e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000002', 'Transformed our apartment balcony into a thriving urban garden! 🌿 Growing our own herbs, vegetables, and flowers. Even small spaces can make a big difference for biodiversity and food security.', '{"/placeholder.svg?height=400&width=600","/placeholder.svg?height=400&width=600"}', 'New York, NY', 'Sustainable Agriculture', 68, '2024-01-14 12:20:00+00'),
('650e8400-e29b-41d4-a716-446655440005', '00000000-0000-0000-0000-000000000001', 'Join us for the Global Climate Strike this Friday! 🌍 Together, we can demand urgent action on climate change. Every voice matters, every action counts. #ClimateStrike #ActNow', '{"/placeholder.svg?height=400&width=800"}', 'Global Event', 'Climate Action', 88, '2024-01-14 09:00:00+00'),
('650e8400-e29b-41d4-a716-446655440006', '00000000-0000-0000-0000-000000000002', 'Amazing breakthrough in renewable energy! Our team has developed a new solar panel technology that is 50% more efficient. This Amazing innovation will help accelerate the transition to clean energy. #Amazing #SolarTech', '{"/placeholder.svg?height=400&width=600"}', 'San Francisco, CA', 'Solar Energy', 92, '2024-01-13 14:30:00+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  content = EXCLUDED.content,
  media_urls = EXCLUDED.media_urls,
  location = EXCLUDED.location,
  sustainability_category = EXCLUDED.sustainability_category,
  impact_score = EXCLUDED.impact_score,
  created_at = EXCLUDED.created_at;

-- Insert sample tasks that don't require user associations
INSERT INTO tasks (title, description, category, points, deadline) VALUES
('Plant a Tree', 'Plant a native tree in your community and share a photo', 'Conservation', 50, '2024-02-15 23:59:59+00'),
('Start Composting', 'Begin composting organic waste and document your setup', 'Waste Reduction', 30, '2024-01-31 23:59:59+00'),
('Energy Audit', 'Conduct a home energy audit and share your findings', 'Energy Efficiency', 40, '2024-02-28 23:59:59+00'),
('Bike to Work Week', 'Use sustainable transportation for a full week', 'Sustainable Transportation', 60, '2024-02-07 23:59:59+00'),
('Community Garden', 'Start or join a community garden project', 'Sustainable Agriculture', 80, '2024-03-15 23:59:59+00')
ON CONFLICT (id) DO NOTHING;

-- Insert sample forums that don't require user associations
INSERT INTO forums (name, description, category) VALUES
('Solar Energy Discussion', 'Share experiences, tips, and questions about solar energy installations', 'Solar Energy'),
('Zero Waste Living', 'Community for those pursuing zero waste lifestyles', 'Waste Reduction'),
('Climate Action Planning', 'Organize and plan climate action initiatives', 'Climate Action')
ON CONFLICT (id) DO NOTHING;
