import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Divider,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import Post from '../components/Post';
import CommentComposer from '../components/CommentComposer';
import Comment from '../components/Comment';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  karma_score: number;
  is_edited: boolean;
  timestamp?: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  }[];
}

export default function SinglePost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid post ID');
      setIsLoading(false);
      return;
    }

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      setError('Invalid post ID format');
      setIsLoading(false);
      return;
    }

    const fetchPostAndComments = async () => {
      try {
        // First check if this is a forum post
        const { data: forumPostData, error: forumPostError } = await supabase
          .from('forum_posts')
          .select(`
            *,
            profiles:user_id (username, full_name, avatar_url),
            communities:community_id (name)
          `)
          .eq('post_id', id)
          .single();

        let postData;
        
        if (!forumPostError && forumPostData) {
          // This is a forum post
          postData = {
            ...forumPostData,
            is_forum_post: true,
            community: forumPostData.communities
          };
        } else {
          // If not found in forum_posts, try the main posts table
          const { data: mainPostData, error: mainPostError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (username, full_name, avatar_url)
            `)
            .eq('post_id', id)
            .single();

          if (mainPostError) throw mainPostError;
          postData = {
            ...mainPostData,
            is_forum_post: false
          };
        }

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            comment_id,
            content,
            created_at,
            user_id,
            post_id,
            parent_id,
            karma_score,
            is_edited,
            profiles!user_id(username, full_name, avatar_url)
          `)
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        setPost({
          ...postData,
          author: postData.profiles,
          timestamp: new Date(postData.created_at).toLocaleString()
        });
        
        setComments(commentsData.map((comment: any) => ({
          comment_id: comment.comment_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at || comment.created_at,
          user_id: comment.user_id,
          post_id: comment.post_id,
          parent_id: comment.parent_id || undefined,
          karma_score: comment.karma_score,
          is_edited: comment.is_edited,
          timestamp: new Date(comment.created_at).toLocaleString(),
          profiles: comment.profiles
        })));
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id]);

  const handleCommentSubmit = async (content: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to comment',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert([{
          post_id: id,
          user_id: user.id,
          content
        }])
        .select(`
          comment_id,
          content,
          created_at,
          user_id,
          post_id,
          parent_id,
          karma_score,
          is_edited,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .single();

      if (commentError) throw commentError;

      setComments([...comments, {
        ...newComment,
        updated_at: newComment.created_at,
        timestamp: new Date(newComment.created_at).toLocaleString()
      }]);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error || !post) {
    return (
      <Container maxW="container.md" py={8}>
        <Box p={4} bg="red.50" color="red.500" borderRadius="md">
          {error || 'Post not found'}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8} minH="100vh" bg="white">
      <VStack spacing={8} align="stretch">
        <Post {...post} />
        
        <Divider />
        
        <Box>
          <CommentComposer onSubmit={handleCommentSubmit} />
          
          <VStack mt={8} spacing={4} align="stretch">
            {comments.map((comment) => (
              <Comment
                key={comment.comment_id}
                id={comment.comment_id}
                author={comment.profiles[0]}
                content={comment.content}
                timestamp={new Date(comment.created_at).toLocaleString()}
                likes_count={comment.karma_score}
                parent_id={comment.parent_id}
              />
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}