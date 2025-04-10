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
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  likes_count: number;
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
    if (!id) return;

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
          .eq('id', id)
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
            .eq('id', id)
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
            *,
            profiles:user_id (username, full_name, avatar_url)
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
          ...comment,
          author: comment.profiles,
          timestamp: new Date(comment.created_at).toLocaleString()
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
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .single();

      if (commentError) throw commentError;

      setComments([...comments, {
        ...newComment,
        author: newComment.profiles,
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
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Post {...post} />
        
        <Divider />
        
        <Box>
          <CommentComposer onSubmit={handleCommentSubmit} />
          
          <VStack mt={8} spacing={4} align="stretch">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                id={comment.id}
                author={comment.author}
                content={comment.content}
                timestamp={new Date(comment.created_at).toLocaleString()}
                likes_count={comment.likes_count}
                parent_id={comment.parent_id}
              />
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}