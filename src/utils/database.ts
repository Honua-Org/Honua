import { supabase } from '../config/supabase';
import { ExtendedUser } from '../types/user';

// Profile operations
export const updateProfile = async (userId: string, data: Partial<ExtendedUser['user_metadata']>) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Post operations
export const createPost = async (userId: string, content: string, mediaUrls: string[] = []) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        media_urls: mediaUrls,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (limit = 10, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Comment operations
export const createComment = async (postId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getComments = async (postId: string, limit = 10, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};