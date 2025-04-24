import type { Database } from './database.types';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at?: string;
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  reposts: number;
  comments: number;
  user_id: string;
  profiles: Profile;
}

export type PostWithProfile = {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  reposts: number;
  comments: number;
  profiles: Profile[];
};