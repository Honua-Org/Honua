import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Badge {
  name: string;
  color: string;
}

export interface UserMetadata {
  name: string;
  avatar_url?: string;
  displayName: string;
}

export interface ExtendedUser extends SupabaseUser {
  user_metadata: UserMetadata;
  posts?: {
    id: string;
    content: string;
    timestamp: Date;
  }[];
  referrals?: string[];
  completedTasks?: string[];
  badges?: Badge[];
  rewards?: {
    points: number;
    badges: string[];
    referralCode: string;
    tasksCompleted: string[];
    pointsPerLike: number;
    pointsPerPost: number;
    pointsPerComment: number;
  };
}

// Update the User type to use our extended version
export type User = ExtendedUser;