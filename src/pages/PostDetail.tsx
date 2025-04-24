import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Divider,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { FaShare, FaFacebook, FaTwitter, FaLink } from 'react-icons/fa';
import Post from '../components/Post';
import Comment from '../components/Comment';
import CommentComposer from '../components/CommentComposer';

interface CommentType {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: CommentType[];
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
}

interface CommentProps extends Omit<CommentType, 'replies'> {
  onReply: (commentId: string, content: string) => void;
  onLike: (commentId: string) => void;
  replies: CommentProps[];
}

interface PostDetailProps {
  postId: string;
}

const PostDetail = ({ postId }: PostDetailProps) => {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const toast = useToast();


  useEffect(() => {
    // TODO: Fetch post and comments from backend
    const fetchPostDetails = async () => {
      try {
        // Mock data for demonstration
        const mockPost = {
          id: postId,
          author: {
            name: 'John Doe',
            username: 'johndoe',
            avatar: 'https://api.dicebear.com/6.x/avatars/svg?seed=john',
          },
          content: 'This is a detailed post about environmental sustainability.',
          likes: 150,
          reposts: 45,
          comments: 23,
          timestamp: new Date().toLocaleString(),
        };

        const mockComments: CommentType[] = [
          {
            id: '1',
            author: {
              name: 'Alice Smith',
              username: 'alice',
              avatar: 'https://api.dicebear.com/6.x/avatars/svg?seed=alice',
            },
            content: 'Great insights! We need more discussions like this.',
            timestamp: new Date().toLocaleString(),
            likes: 5,
            replies: [
              {
                id: '1.1',
                author: {
                  name: 'Bob Johnson',
                  username: 'bob',
                  avatar: 'https://api.dicebear.com/6.x/avatars/svg?seed=bob',
                },
                content: 'Totally agree with you, Alice!',
                timestamp: new Date().toLocaleString(),
                likes: 2,
                replies: [],
              },
            ],
          },
        ];

        setPost(mockPost);
        setComments(mockComments);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching post details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load post details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchPostDetails();
  }, [postId, toast]);

  const handleCommentSubmit = async (content: string) => {
    try {
      // TODO: Implement comment submission to backend
      const newCommentObj: CommentType = {
        id: Date.now().toString(),
        author: {
          name: 'Current User',
          username: 'currentuser',
          avatar: 'https://api.dicebear.com/6.x/avatars/svg?seed=current',
        },
        content,
        timestamp: new Date().toLocaleString(),
        likes: 0,
        replies: [],
      };

      setComments([newCommentObj, ...comments]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    try {
      // TODO: Implement reply submission to backend
      const newReply: CommentType = {
        id: Date.now().toString(),
        author: {
          name: 'Current User',
          username: 'currentuser',
          avatar: 'https://api.dicebear.com/6.x/avatars/svg?seed=current',
        },
        content,
        timestamp: new Date().toLocaleString(),
        likes: 0,
        replies: [],
      };

      const updateReplies = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, replies: [newReply, ...comment.replies] };
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateReplies(comment.replies) };
          }
          return comment;
        });
      };

      setComments(updateReplies(comments));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      // TODO: Implement like functionality with backend
      // For now, we'll just update the UI optimistically
      const updateLikes = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return comment;
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateLikes(comment.replies) };
          }
          return comment;
        });
      };

      setComments(updateLikes(comments));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const text = post?.content || 'Check out this post!';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link Copied',
          description: 'Post link copied to clipboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
    }
  };


  const updateReplies = (comments: CommentType[]): CommentProps[] => {
    return comments.map(comment => ({
      ...comment,
      onReply: handleReply,
      onLike: handleLike,
      replies: updateReplies(comment.replies)
    }));
  };

  return (
    <Container maxW="container.md" py={8}>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {post && <Post {...post} />}
          
          <Box position="relative">
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="bold">
                Comments ({comments.length})
              </Text>
              <HStack spacing={2}>
                <IconButton
                  icon={<FaShare />}
                  aria-label="Share post"
                  variant="ghost"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                />
                {showShareMenu && (
                  <HStack spacing={2} position="absolute" right="0" top="100%" bg="white" p={2} shadow="md" borderRadius="md" zIndex={1}>
                    <IconButton
                      icon={<FaFacebook />}
                      aria-label="Share on Facebook"
                      onClick={() => handleShare('facebook')}
                      colorScheme="facebook"
                      variant="ghost"
                    />
                    <IconButton
                      icon={<FaTwitter />}
                      aria-label="Share on Twitter"
                      onClick={() => handleShare('twitter')}
                      colorScheme="twitter"
                      variant="ghost"
                    />
                    <IconButton
                      icon={<FaLink />}
                      aria-label="Copy link"
                      onClick={() => handleShare()}
                      variant="ghost"
                    />
                  </HStack>
                )}
              </HStack>
            </HStack>

            <CommentComposer
              onSubmit={handleCommentSubmit}
              placeholder="Write a comment..."
            />

            <Divider my={6} />

            <VStack spacing={4} align="stretch">
              {updateReplies(comments).map((comment) => (
                <Comment
                  key={comment.id}
                  {...comment}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      )}
    </Container>
  );


};

export default PostDetail;