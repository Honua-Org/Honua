-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invites_invite_code ON public.invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON public.invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_user_id ON public.invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_invites_is_active ON public.invites(is_active);
CREATE INDEX IF NOT EXISTS idx_invites_is_used ON public.invites(is_used);

-- Enable Row Level Security
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own invites (as inviter)
CREATE POLICY "Users can view their own invites" ON public.invites
    FOR SELECT USING (auth.uid() = inviter_id);

-- Users can create invites
CREATE POLICY "Users can create invites" ON public.invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Users can update their own invites
CREATE POLICY "Users can update their own invites" ON public.invites
    FOR UPDATE USING (auth.uid() = inviter_id);

-- Allow public read access for invite validation (needed for invite pages)
CREATE POLICY "Public can validate invites" ON public.invites
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to accept invites
CREATE POLICY "Authenticated users can accept invites" ON public.invites
    FOR UPDATE USING (auth.uid() IS NOT NULL AND is_active = true AND NOT is_used);

-- Create function to get invite leaderboard
CREATE OR REPLACE FUNCTION get_invite_leaderboard()
RETURNS TABLE (
    inviter_id UUID,
    invite_count BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.inviter_id,
        COUNT(i.id) as invite_count,
        ROW_NUMBER() OVER (ORDER BY COUNT(i.id) DESC) as rank
    FROM public.invites i
    WHERE i.is_used = true
    GROUP BY i.inviter_id
    ORDER BY invite_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add points to users (if points system exists)
CREATE OR REPLACE FUNCTION add_user_points(
    user_id UUID,
    points INTEGER,
    description TEXT DEFAULT 'Points awarded'
)
RETURNS VOID AS $$
BEGIN
    -- Check if user_points table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points') THEN
        INSERT INTO public.user_points (user_id, points, description, created_at)
        VALUES (user_id, points, description, NOW());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.invites TO authenticated;
GRANT SELECT ON public.invites TO anon;
GRANT EXECUTE ON FUNCTION get_invite_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points(UUID, INTEGER, TEXT) TO authenticated;

-- Insert some sample data (optional)
-- INSERT INTO public.invites (invite_code, inviter_id, is_active) 
-- SELECT 'SAMPLE123', id, true FROM auth.users LIMIT 1;