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
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          avatar_url: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          avatar_url?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          content: string
          created_at: string
          likes: number
          reposts: number
          comments: number
          user_id: string
        }
        Insert: {
          id?: string
          content: string
          created_at?: string
          likes?: number
          reposts?: number
          comments?: number
          user_id: string
        }
        Update: {
          id?: string
          content?: string
          created_at?: string
          likes?: number
          reposts?: number
          comments?: number
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}