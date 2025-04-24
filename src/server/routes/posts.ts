import { Router } from 'express';
import { Post, PostWithProfile, Profile } from '../types';
import { supabase } from '../utils/supabaseClient';

const router = Router();

// Get posts with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 0, limit = 4, userId } = req.query;
    const start = Number(page) * Number(limit);
    const end = start + Number(limit) - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        likes,
        reposts,
        comments,
        profiles!inner(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    const formattedPosts = (data as PostWithProfile[]).map((post) => ({
      id: post.id,
      author: {
        name: post.profiles[0].full_name,
        username: post.profiles[0].username,
        avatar: post.profiles[0].avatar_url,
      },
      content: post.content,
      likes: post.likes,
      reposts: post.reposts,
      comments: post.comments,
      timestamp: new Date(post.created_at).toLocaleString(),
    }));

    res.json({
      posts: formattedPosts,
      hasMore: data.length === Number(limit),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { content, userId } = req.body;

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        content,
        user_id: userId,
        likes: 0,
        reposts: 0,
        comments: 0,
      }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like/unlike a post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isLiked } = req.body;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;

    const { data, error } = await supabase
      .from('posts')
      .update({ likes: newLikes })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating post likes:', error);
    res.status(500).json({ error: 'Failed to update post likes' });
  }
});

// Repost/unrepost a post
router.post('/:id/repost', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isReposted } = req.body;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('reposts')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newReposts = isReposted ? post.reposts - 1 : post.reposts + 1;

    const { data, error } = await supabase
      .from('posts')
      .update({ reposts: newReposts })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating post reposts:', error);
    res.status(500).json({ error: 'Failed to update post reposts' });
  }
});

export default router;