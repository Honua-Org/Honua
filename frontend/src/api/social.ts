import { supabase } from '../lib/supabase';

export interface SocialInteraction {
  post_id: string;
  user_id: string;
  interaction_type: 'like' | 'repost';
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  likes_count: number;
  created_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const socialApi = {
  // Like/Unlike a post
  toggleLike: async (postId: string, userId: string): Promise<{ success: boolean; isLiked: boolean }> => {
    try {
      // First check if the post exists in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      // If not found in posts table, check forum_posts table
      if (postError || !post) {
        const { data: forumPost, error: forumPostError } = await supabase
          .from('forum_posts')
          .select('id')
          .eq('id', postId)
          .single();

        if (forumPostError || !forumPost) {
          throw new Error('Post not found');
        }
      }

      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;
        return { success: true, isLiked: false };
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) throw error;
        return { success: true, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error('Failed to toggle like');
    }
  },

  // Repost/Unrepost a post
  toggleRepost: async (postId: string, userId: string): Promise<{ success: boolean; isReposted: boolean }> => {
    try {
      // First check if the post exists in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      // If not found in posts table, check forum_posts table
      if (postError || !post) {
        const { data: forumPost, error: forumPostError } = await supabase
          .from('forum_posts')
          .select('id')
          .eq('id', postId)
          .single();

        if (forumPostError || !forumPost) {
          throw new Error('Post not found');
        }
      }

      const { data: existingRepost } = await supabase
        .from('post_reposts')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingRepost) {
        // Unrepost
        const { error } = await supabase
          .from('post_reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;
        return { success: true, isReposted: false };
      } else {
        // Repost
        const { error } = await supabase
          .from('post_reposts')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) throw error;
        return { success: true, isReposted: true };
      }
    } catch (error) {
      console.error('Error toggling repost:', error);
      throw new Error('Failed to toggle repost');
    }
  },

  // Add a comment
  addComment: async (postId: string, userId: string, content: string, parentId?: string): Promise<Comment> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: userId,
          content,
          parent_id: parentId
        }])
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        author: data.profiles
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  },

  // Get post interaction status for current user
  getInteractionStatus: async (postId: string, userId: string): Promise<{ isLiked: boolean; isReposted: boolean }> => {
    try {
      const [{ data: likes }, { data: reposts }] = await Promise.all([
        supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId),
        supabase
          .from('post_reposts')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
      ]);

      return {
        isLiked: Boolean(likes && likes.length > 0),
        isReposted: Boolean(reposts && reposts.length > 0)
      };
    } catch (error) {
      console.error('Error getting interaction status:', error);
      throw new Error('Failed to get interaction status');
    }
  },

  // Share post
  sharePost: async (postId: string): Promise<{ url: string }> => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    return { url: shareUrl };
  }
};

export default socialApi;