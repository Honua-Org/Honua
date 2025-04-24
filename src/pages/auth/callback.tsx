import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error.message);
          navigate('/login?error=auth-failed');
          return;
        }

        if (session) {
          // Check if user profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            // Create a new profile if it doesn't exist
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: session.user.email?.split('@')[0] || `user_${Date.now()}`,
                  full_name: session.user.user_metadata.full_name || '',
                  avatar_url: session.user.user_metadata.avatar_url || ''
                }
              ]);

            if (profileError) {
              console.error('Error creating profile:', profileError.message);
            }
          }

          // Redirect to feed page after successful authentication
          navigate('/feed');
        } else {
          navigate('/login?error=no-session');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        navigate('/login?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}