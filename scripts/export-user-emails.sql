-- Script to create a user emails export table and sync with auth.users
-- This will create a table that automatically updates when new users register

-- Create the user_emails table
CREATE TABLE IF NOT EXISTS public.user_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to read all emails (for exports)
CREATE POLICY "Service role can read all user emails" ON public.user_emails
    FOR SELECT USING (auth.role() = 'service_role');

-- Create policy to allow authenticated users to read their own email
CREATE POLICY "Users can read own email" ON public.user_emails
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to sync user emails from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user email when auth.users is modified
    INSERT INTO public.user_emails (user_id, email, email_confirmed_at)
    VALUES (NEW.id, NEW.email, NEW.email_confirmed_at)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        email = NEW.email,
        email_confirmed_at = NEW.email_confirmed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync when new users are created or updated
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email();

-- Initial sync: populate table with existing users
INSERT INTO public.user_emails (user_id, email, email_confirmed_at)
SELECT 
    id,
    email,
    email_confirmed_at
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for easy email export
CREATE OR REPLACE VIEW public.user_emails_export AS
SELECT 
    ue.email,
    ue.email_confirmed_at,
    ue.created_at as user_registered_at,
    CASE 
        WHEN ue.email_confirmed_at IS NOT NULL THEN 'confirmed'
        ELSE 'pending'
    END as email_status
FROM public.user_emails ue
ORDER BY ue.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON public.user_emails TO authenticated;
GRANT SELECT ON public.user_emails_export TO authenticated;
GRANT ALL ON public.user_emails TO service_role;
GRANT SELECT ON public.user_emails_export TO service_role;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_emails_email ON public.user_emails(email);
CREATE INDEX IF NOT EXISTS idx_user_emails_created_at ON public.user_emails(created_at);

-- Comments for documentation
COMMENT ON TABLE public.user_emails IS 'Table to store and export user emails from auth.users';
COMMENT ON VIEW public.user_emails_export IS 'View for easy CSV export of user emails';

-- Example queries for exporting:
-- 
-- Export all emails:
-- SELECT * FROM public.user_emails_export;
--
-- Export only confirmed emails:
-- SELECT email FROM public.user_emails_export WHERE email_status = 'confirmed';
--
-- Export emails from last 30 days:
-- SELECT email FROM public.user_emails_export WHERE user_registered_at >= NOW() - INTERVAL '30 days';