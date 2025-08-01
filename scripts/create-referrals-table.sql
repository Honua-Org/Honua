-- Create referrals table to track invite system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL, -- The code used for the invite (username or truncated user ID)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(inviter_id, invited_user_id)
);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can view referrals they are involved in" ON referrals
  FOR SELECT USING (
    auth.uid() = inviter_id OR auth.uid() = invited_user_id
  );

CREATE POLICY "Users can insert referrals for themselves" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = invited_user_id);

CREATE POLICY "Users can update referrals they are involved in" ON referrals
  FOR UPDATE USING (
    auth.uid() = inviter_id OR auth.uid() = invited_user_id
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_user_id ON referrals(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Create function to get invites leaderboard
CREATE OR REPLACE FUNCTION get_invites_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  invites INTEGER,
  points_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY invite_count DESC)::INTEGER as rank,
    p.id as user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    invite_count::INTEGER as invites,
    (invite_count * 10)::INTEGER as points_earned
  FROM (
    SELECT 
      r.inviter_id,
      COUNT(*)::INTEGER as invite_count
    FROM referrals r
    WHERE r.status = 'completed'
    GROUP BY r.inviter_id
  ) invite_stats
  JOIN profiles p ON p.id = invite_stats.inviter_id
  ORDER BY invite_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_invites_leaderboard TO authenticated;