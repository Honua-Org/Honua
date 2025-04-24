import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async (userId: string, force: boolean = false) => {
    // Skip fetching if we already have the profile data and force refresh isn't requested
    if (!force && userProfile && userProfile.id === userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        return;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Initialize auth state and set up session handling
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        const currentUser = session?.user ?? null;
        
        if (session && currentUser) {
          setSession(session);
          setUser(currentUser);
          await fetchUserProfile(currentUser.id);
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Ensure loading state is set at the start of state change
      setLoading(true);
      
      if (!subscription) {
        console.error('Failed to initialize auth subscription');
        setLoading(false);
        return;
      }

      try {
        // Handle session state
        if (!newSession || !newSession.user) {
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            const user = newSession.user;
            if (!user) {
              console.error('No user data in session');
              setLoading(false);
              return;
            }
            setUser(user);
            setSession(newSession);
            await fetchUserProfile(user.id, event === 'SIGNED_IN');
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setSession(null);
            setUserProfile(null);
            break;

          default:
            // Handle any other auth events if needed
            break;
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    signUp: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;

      // Create profile for email signup
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              username: email.split('@')[0] || `user_${Date.now()}`,
              full_name: '',
              avatar_url: '',
              role: 'default_role' // Add default role here
            }]);

          if (profileError) {
            console.error('Error creating profile:', profileError.message);
          }
        } catch (err) {
          console.error('Error creating profile:', err);
        }
      }
    },
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error instanceof AuthError && error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in');
        }
        throw error;
      }
    },
    signInWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    },
    refreshSession: async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) throw error;
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
    },
    user,
    loading,
    userProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}