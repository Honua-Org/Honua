import { supabase } from '../lib/supabase';

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
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
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
}