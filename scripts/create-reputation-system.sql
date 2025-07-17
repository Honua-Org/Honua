-- Create reputation_actions table to track all actions that affect reputation
CREATE TABLE IF NOT EXISTS reputation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'post_created', 'post_liked', 'post_shared', 'post_reported',
    'comment_created', 'comment_liked', 'comment_helpful',
    'task_completed', 'achievement_earned', 'verified_action',
    'community_participation', 'educational_content', 'sustainability_impact',
    'peer_recognition', 'consistency_bonus', 'inactivity_penalty'
  )),
  points INTEGER NOT NULL,
  reference_id UUID, -- Can reference post_id, comment_id, task_id, etc.
  reference_type VARCHAR(50), -- 'post', 'comment', 'task', 'achievement', etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'sustainability', 'community', 'content', 'engagement', 'impact'
  )),
  points INTEGER DEFAULT 0,
  requirements JSONB, -- Store achievement requirements as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create sustainability_tasks table
CREATE TABLE IF NOT EXISTS sustainability_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  verification_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_task_completions table
CREATE TABLE IF NOT EXISTS user_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES sustainability_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_proof TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, task_id)
);

-- Create reputation_levels table
CREATE TABLE IF NOT EXISTS reputation_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  badge_color TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  description TEXT,
  benefits JSONB -- Store level benefits as JSON
);

-- Enable RLS for new tables
ALTER TABLE reputation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_levels ENABLE ROW LEVEL SECURITY;

-- Create policies for reputation_actions
CREATE POLICY "Users can view their own reputation actions" ON reputation_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reputation actions" ON reputation_actions
  FOR INSERT WITH CHECK (true); -- Allow system to insert

-- Create policies for achievements
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

-- Create policies for user_achievements
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can insert user achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- Create policies for sustainability_tasks
CREATE POLICY "Tasks are viewable by everyone" ON sustainability_tasks
  FOR SELECT USING (true);

-- Create policies for user_task_completions
CREATE POLICY "Users can view all task completions" ON user_task_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own task completions" ON user_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task completions" ON user_task_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for reputation_levels
CREATE POLICY "Reputation levels are viewable by everyone" ON reputation_levels
  FOR SELECT USING (true);

-- Insert default reputation levels
INSERT INTO reputation_levels (name, min_score, max_score, badge_color, badge_icon, description, benefits) VALUES
('New Member', 0, 100, '#6B7280', '🌱', 'Welcome to the community! Start your sustainability journey.', '{"features": ["Basic posting", "Comment on posts", "Like posts"]}'),
('Active Contributor', 101, 300, '#10B981', '🌿', 'Regular participant making positive contributions.', '{"features": ["Create polls", "Join forums", "Basic task access"]}'),
('Trusted Member', 301, 600, '#3B82F6', '🌳', 'Established community member with proven engagement.', '{"features": ["Moderate comments", "Create events", "Advanced tasks"]}'),
('Community Expert', 601, 900, '#8B5CF6', '🏆', 'Recognized expert in sustainability topics.', '{"features": ["Mentor others", "Verify tasks", "Expert badge"]}'),
('Sustainability Leader', 901, 9999, '#F59E0B', '👑', 'Top-tier community leader driving real change.', '{"features": ["All features", "Leadership badge", "Priority support"]}')
ON CONFLICT (name) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points, requirements) VALUES
('First Post', 'Created your first sustainability post', '📝', 'content', 10, '{"posts_count": 1}'),
('Solar Pioneer', 'Shared content about solar energy', '☀️', 'sustainability', 25, '{"solar_posts": 1}'),
('Climate Advocate', 'Posted 10+ times about climate action', '🌍', 'sustainability', 50, '{"climate_posts": 10}'),
('Community Helper', 'Received 50+ likes on helpful comments', '🤝', 'community', 30, '{"comment_likes": 50}'),
('Consistency Champion', 'Posted regularly for 30 days', '📅', 'engagement', 40, '{"consecutive_days": 30}'),
('Impact Maker', 'Achieved 500+ total impact score', '💚', 'impact', 75, '{"total_impact": 500}'),
('Task Master', 'Completed 10 sustainability tasks', '✅', 'engagement', 60, '{"tasks_completed": 10}'),
('Mentor', 'Helped verify 5+ community tasks', '👨‍🏫', 'community', 80, '{"tasks_verified": 5}'),
('Eco Educator', 'Shared 20+ educational sustainability posts', '📚', 'content', 70, '{"educational_posts": 20}'),
('Green Influencer', 'Reached 1000+ followers', '🌟', 'community', 100, '{"followers_count": 1000}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample sustainability tasks
INSERT INTO sustainability_tasks (title, description, category, difficulty, points, impact_score, verification_required) VALUES
('Install LED Bulbs', 'Replace 5 incandescent bulbs with LED bulbs in your home', 'Energy', 'easy', 15, 20, true),
('Start Composting', 'Set up a composting system for organic waste', 'Waste', 'medium', 25, 35, true),
('Use Public Transport', 'Use public transportation for a week instead of driving', 'Transportation', 'easy', 20, 30, false),
('Plant Native Species', 'Plant 3 native plants in your garden or community', 'Biodiversity', 'medium', 30, 40, true),
('Reduce Water Usage', 'Implement water-saving measures and track usage for a month', 'Water', 'medium', 35, 45, true),
('Solar Panel Installation', 'Install solar panels on your property', 'Energy', 'hard', 100, 150, true),
('Organize Community Cleanup', 'Organize and lead a community cleanup event', 'Community', 'hard', 80, 100, true),
('Zero Waste Week', 'Produce zero waste for an entire week', 'Waste', 'hard', 60, 80, true),
('Bike to Work', 'Commute by bicycle for two weeks', 'Transportation', 'medium', 40, 50, false),
('Energy Audit', 'Conduct a home energy audit and implement improvements', 'Energy', 'medium', 45, 60, true)
ON CONFLICT (title) DO NOTHING;

-- Create function to calculate user reputation
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_reputation INTEGER := 0;
BEGIN
  -- Sum all reputation actions for the user
  SELECT COALESCE(SUM(points), 0) INTO total_reputation
  FROM reputation_actions
  WHERE user_id = user_uuid;
  
  RETURN total_reputation;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user reputation level
CREATE OR REPLACE FUNCTION get_user_reputation_level(reputation_score INTEGER)
RETURNS TABLE(
  level_name TEXT,
  badge_color TEXT,
  badge_icon TEXT,
  description TEXT,
  benefits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT rl.name, rl.badge_color, rl.badge_icon, rl.description, rl.benefits
  FROM reputation_levels rl
  WHERE reputation_score >= rl.min_score AND reputation_score <= rl.max_score
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to add reputation points
CREATE OR REPLACE FUNCTION add_reputation_points(
  user_uuid UUID,
  action_type_param VARCHAR(50),
  points_param INTEGER,
  reference_id_param UUID DEFAULT NULL,
  reference_type_param VARCHAR(50) DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert reputation action
  INSERT INTO reputation_actions (user_id, action_type, points, reference_id, reference_type, description)
  VALUES (user_uuid, action_type_param, points_param, reference_id_param, reference_type_param, description_param);
  
  -- Update user's reputation in profiles table
  UPDATE profiles
  SET reputation = calculate_user_reputation(user_uuid),
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reputation_actions_user_id ON reputation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_actions_created_at ON reputation_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user_id ON user_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation DESC);