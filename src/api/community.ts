import { supabase } from '../lib/supabase';

type CommunityRole = 'admin' | 'member';

const getUserRole = async (communityId: string, userId: string): Promise<CommunityRole | null> => {
  const { data, error } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data?.role as CommunityRole;
};

const communityApi = {
  getUserRole,
};

export default communityApi;