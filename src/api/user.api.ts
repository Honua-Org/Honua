import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  bio?: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
}

export const userService = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  },

  async getUserProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return profile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    await this.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error) {
      // If error is not found, username is available
      if (error.code === 'PGRST116') {
        return true;
      }
      throw error;
    }

    // If we found a matching username, it's not available
    return !data;
  },

  async getUserProfileByUsername(username: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    return profile;
  },

  async followUser(userId: string, targetUserId: string) {
    const { error } = await supabase
      .from('followers')
      .insert({ follower_id: userId, following_id: targetUserId });
    if (error) throw new Error('Failed to follow user');
  },

  async unfollowUser(userId: string, targetUserId: string) {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);
    if (error) throw new Error('Failed to unfollow user');
  },

  async isFollowing(userId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single();
    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
    return !!data;
  },

  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact' })
      .eq('following_id', userId);

    if (error) throw error;
    return count || 0;
  },

  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact' })
      .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        post_id,
        user_id,
        content,
        created_at,
        likes_count,
        comments_count,
        reposts_count
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts || [];
  }
};