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
      if (!postId || !userId) {
        throw new Error('Post ID and User ID are required');
      }

      // Check if the post exists in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('post_id')
        .eq('post_id', postId)
        .single();

      if (postError) {
        console.error('Error checking post existence:', postError);
        throw new Error('Failed to verify post existence');
      }

      if (!post) {
        throw new Error('Post not found');
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
      throw error instanceof Error ? error : new Error('Failed to toggle like');
    }
  },

  // Repost/Unrepost a post
  toggleRepost: async (postId: string, userId: string): Promise<{ success: boolean; isReposted: boolean }> => {
    try {
      // Check if the post exists in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('post_id')
        .eq('post_id', postId)
        .single();

      if (postError) {
        console.error('Error checking post existence:', postError);
        throw new Error('Failed to verify post existence');
      }

      if (!post) {
        throw new Error('Post not found');
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
      if (!postId || !userId) {
        throw new Error('Post ID and User ID are required for checking interaction status');
      }

      // Check if the post exists in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('post_id')
        .eq('post_id', postId)
        .single();

      if (postError) {
        console.error('Error checking post existence:', postError);
        throw new Error(`Failed to verify post existence: ${postError.message}`);
      }

      if (!post) {
        throw new Error(`Post with ID ${postId} not found`);
      }

      const [likesResponse, repostsResponse] = await Promise.all([
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

      if (likesResponse.error) {
        console.error('Error checking likes:', likesResponse.error);
        throw new Error(`Failed to check like status: ${likesResponse.error.message}`);
      }

      if (repostsResponse.error) {
        console.error('Error checking reposts:', repostsResponse.error);
        throw new Error(`Failed to check repost status: ${repostsResponse.error.message}`);
      }

      return {
        isLiked: Boolean(likesResponse.data && likesResponse.data.length > 0),
        isReposted: Boolean(repostsResponse.data && repostsResponse.data.length > 0)
      };
    } catch (error) {
      console.error('Error getting interaction status:', error);
      throw error instanceof Error ? error : new Error('Failed to get interaction status');
    }
  },

  // Share post
  sharePost: async (postId: string): Promise<{ url: string }> => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    return { url: shareUrl };
  },

  // Edit post
  editPost: async (postId: string, userId: string, content: string): Promise<{ success: boolean }> => {
    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('post_id', postId)
        .single();

      if (postError || !post) {
        throw new Error('Post not found');
      }

      if (post.user_id !== userId) {
        throw new Error('Unauthorized to edit this post');
      }

      const { error } = await supabase
        .from('posts')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('post_id', postId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error editing post:', error);
      throw error instanceof Error ? error : new Error('Failed to edit post');
    }
  },

  // Delete post
  deletePost: async (postId: string, userId: string): Promise<{ success: boolean }> => {
    try {
      // Basic validation for required fields
      if (!postId?.trim()) {
        throw new Error('Post ID is required');
      }
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }
      // First check if the post exists and belongs to the user
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('post_id', postId)
        .single();

      if (postError) {
        throw new Error(`Failed to check post existence: ${postError.message}`);
      }

      if (!post) {
        throw new Error(`Post with ID ${postId} not found`);
      }

      if (post.user_id !== userId) {
        throw new Error('You are not authorized to delete this post');
      }

      // Proceed with deletion if all checks pass
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to delete post: ${deleteError.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error instanceof Error ? error : new Error('Failed to delete post');
    }
  },

  // Vote on a poll
  votePoll: async (pollId: string, optionText: string, userId: string): Promise<{ success: boolean }> => {
    try {
      if (!pollId?.trim()) {
        throw new Error('Poll ID is required');
      }
      if (!optionText?.trim()) {
        throw new Error('Option text is required');
      }
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      // Check if the poll exists
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('poll_id')
        .eq('poll_id', pollId)
        .single();

      if (pollError || !poll) {
        throw new Error('Poll not found');
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        throw new Error('You have already voted on this poll');
      }

      // Record the vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert([{
          poll_id: pollId,
          user_id: userId,
          option_text: optionText,
        }]);

      if (voteError) {
        throw new Error(`Failed to record vote: ${voteError.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error instanceof Error ? error : new Error('Failed to vote on poll');
    }
  }
};

export default socialApi;