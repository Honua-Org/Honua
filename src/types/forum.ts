import { Database } from './supabase';

export type ForumPost = Database['public']['Tables']['forum_posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];

export interface CommentWithReplies extends Comment {
  author?: { username: string };
  replies?: CommentWithReplies[];
}

export interface ForumPostWithAuthor extends ForumPost {
  author?: { username: string };
  community?: { name: string };
}