import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from './client';

export interface Post {
  id: string;
  content: string;
  user_id: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
}

const postsApi = {
  getPosts: async (page: number = 0, limit: number = 10): Promise<PostsResponse> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      const posts = data.map(post => ({
        ...post,
        timestamp: post.created_at,
        media_urls: post.media_url,
        author: {
          id: post.user_id,
          ...post.profiles
        }
      }));

      return {
        posts,
        hasMore: data.length === limit
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },

  createPost: async (content: string, userId: string, media_url: string[] = [], poll?: { question: string; options: { text: string; votes: number }[] }): Promise<Post> => {
    try {
      // Validate required fields
      if (!content?.trim()) {
        throw new Error('Post content is required');
      }
      if (!userId) {
        throw new Error('User must be authenticated to create a post');
      }

      let pollId = null;
      if (poll) {
        // Create poll first if provided
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .insert([{
            question: poll.question,
            options: poll.options,
            ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          }])
          .select()
          .single();

        if (pollError) throw pollError;
        pollId = pollData.poll_id;
      }

      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          content: content.trim(),
          user_id: userId,
          media_url: media_url.filter(url => url?.trim()),
          poll_id: pollId
        }])
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23503') { // Foreign key violation
          throw new Error('Invalid user account');
        } else if (error.code === '23502') { // Not null violation
          throw new Error('Missing required fields');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('No data returned after creating post');
      }

      return {
        ...data,
        author: data.profiles
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error instanceof Error ? error : new Error('Failed to create post');
    }
  },

  likePost: async (postId: string, userId: string, isLiked: boolean): Promise<Post> => {
    try {
      const response = await axios.post(`${API_URL}/api/posts/${postId}/like`, {
        userId,
        isLiked,
      });
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  },

  repostPost: async (postId: string, userId: string, isReposted: boolean): Promise<Post> => {
    try {
      const response = await axios.post(`${API_URL}/api/posts/${postId}/repost`, {
        userId,
        isReposted,
      });
      return response.data;
    } catch (error) {
      console.error('Error reposting:', error);
      throw new Error('Failed to repost');
    }
  },
};

export default postsApi;