export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      forum_posts: {
        Row: {
          id: string
          title: string
          content: string | null
          media_url: string[] | null
          created_at: string
          updated_at: string
          author_id: string | null
          community_id: string
          karma_score: number
          comment_count: number
          post_type: 'text' | 'link' | 'image' | 'video'
          is_pinned: boolean
          is_locked: boolean
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          media_url?: string[] | null
          created_at?: string
          updated_at?: string
          author_id?: string | null
          community_id: string
          karma_score?: number
          comment_count?: number
          post_type?: 'text' | 'link' | 'image' | 'video'
          is_pinned?: boolean
          is_locked?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          media_url?: string[] | null
          created_at?: string
          updated_at?: string
          author_id?: string | null
          community_id?: string
          karma_score?: number
          comment_count?: number
          post_type?: 'text' | 'link' | 'image' | 'video'
          is_pinned?: boolean
          is_locked?: boolean
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          created_at: string
          updated_at: string
          author_id: string | null
          post_id: string
          parent_id: string | null
          karma_score: number
          is_edited: boolean
        }
        Insert: {
          id?: string
          content: string
          created_at?: string
          updated_at?: string
          author_id?: string | null
          post_id: string
          parent_id?: string | null
          karma_score?: number
          is_edited?: boolean
        }
        Update: {
          id?: string
          content?: string
          created_at?: string
          updated_at?: string
          author_id?: string | null
          post_id?: string
          parent_id?: string | null
          karma_score?: number
          is_edited?: boolean
        }
      },
      communities: {
        Row: {
          id: string
          name: string
          description: string
          rules: string | null
          member_count: number
          created_at: string
          banner_url: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          rules?: string | null
          member_count?: number
          created_at?: string
          banner_url?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          rules?: string | null
          member_count?: number
          created_at?: string
          banner_url?: string | null
          avatar_url?: string | null
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}