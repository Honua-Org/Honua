import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

interface UserRewards {
  points: number;
  badges: string[];
  referralCode: string;
  tasksCompleted: string[];
  pointsPerLike: number;
  pointsPerPost: number;
  pointsPerComment: number;
}

interface AuthState {
  user: User | null;
  rewards: UserRewards | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setRewards: (rewards: UserRewards | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize auth state listener
  supabase.auth.onAuthStateChange(async (_event, session) => {
    set({ isLoading: true });
    try {
      if (session) {
        set({ user: session.user });
        // Fetch user rewards from the database
        const { data: rewards, error: rewardsError } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (rewardsError) throw rewardsError;
        set({
          rewards: rewards || {
            points: 0,
            badges: [],
            referralCode: '',
            tasksCompleted: [],
            pointsPerLike: 5,
            pointsPerPost: 10,
            pointsPerComment: 3
          }
        });
      } else {
        set({ user: null, rewards: null });
      }
      set({ error: null });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  });

  // Get initial session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    set({ isLoading: true });
    try {
      if (session) {
        set({ user: session.user });
        // Fetch user rewards from the database
        const { data: rewards, error: rewardsError } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (rewardsError) throw rewardsError;
        set({
          rewards: rewards || {
            points: 0,
            badges: [],
            referralCode: '',
            tasksCompleted: [],
            pointsPerLike: 5,
            pointsPerPost: 10,
            pointsPerComment: 3
          }
        });
      }
      set({ error: null });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  });

  return {
    user: null,
    rewards: null,
    isLoading: true,
    error: null,
    setUser: (user) => set({ user }),
    setRewards: (rewards) => set({ rewards }),
    setError: (error) => set({ error }),
    setLoading: (isLoading) => set({ isLoading }),
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, rewards: null });
      } catch (error: any) {
        set({ error: error.message });
      }
    },
  };
});
