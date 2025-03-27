import { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  HStack,
  IconButton,
  Button,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes: number;
  comments: number;
  timestamp: Date;
}

export const HomeFeed = () => {
  const { user, rewards } = useAuthStore();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]); // This will be replaced with API calls
  const toast = useToast();

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    try {
      // TODO: Implement post creation API call
      const post: Post = {
        id: Date.now().toString(),
        content: newPost,
        author: {
          id: user?.id || '',
          name: user?.user_metadata?.name || 'Anonymous',
          avatar: user?.user_metadata?.avatar_url || undefined,
        },
        likes: 0,
        comments: 0,
        timestamp: new Date(),
      };

      setPosts([post, ...posts]);
      setNewPost('');

      // Award points for creating a post
      // TODO: Implement points system API call
      toast({
        title: 'Post created!',
        description: '+5 points for creating a post',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Update the posts state to reflect the like
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));

      // Add points to user's rewards
      if (rewards) {
        // TODO: Update rewards in the backend
        toast({
          title: 'Points earned!',
          description: `+${rewards.pointsPerLike || 1} points for engagement`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="600px" mx="auto" py={8} px={4}>
      {user && (
        <Box mb={8} p={4} borderWidth={1} borderRadius="lg">
          <VStack spacing={4} align="stretch">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              resize="none"
            />
            <Button
              colorScheme="blue"
              alignSelf="flex-end"
              onClick={handleCreatePost}
              isDisabled={!newPost.trim()}
            >
              Post
            </Button>
          </VStack>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {posts.map((post) => (
          <Box key={post.id} p={4} borderWidth={1} borderRadius="lg">
            <VStack align="stretch" spacing={4}>
              <HStack>
                <Avatar
                  size="sm"
                  name={post.author.name}
                  src={post.author.avatar}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">{post.author.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {post.timestamp.toLocaleString()}
                  </Text>
                </VStack>
              </HStack>

              <Text>{post.content}</Text>

              <HStack spacing={4}>
                <IconButton
                  aria-label="Like"
                  icon={<FiHeart />}
                  variant="ghost"
                  onClick={() => handleLike(post.id)}
                />
                <Text>{post.likes}</Text>
                <IconButton
                  aria-label="Comment"
                  icon={<FiMessageSquare />}
                  variant="ghost"
                />
                <Text>{post.comments}</Text>
                <IconButton
                  aria-label="Share"
                  icon={<FiShare2 />}
                  variant="ghost"
                />
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};