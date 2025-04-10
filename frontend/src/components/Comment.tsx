import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { FaHeart, FaReply, FaEllipsisH } from 'react-icons/fa';
import CommentComposer from './CommentComposer';

interface CommentProps {
  id: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  content: string;
  timestamp: string;
  likes_count: number;
  parent_id?: string;
  depth?: number;
}

const Comment = ({
  id,
  author,
  content,
  timestamp,
  likes_count: initialLikesCount = 0,
  depth = 0,
}: CommentProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const { user } = useAuth();
  const toast = useToast();

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to like comments',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert([{ comment_id: id, user_id: user.id }]);

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
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

  const handleReplySubmit = async (content: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to reply',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          content,
          user_id: user.id,
          parent_id: id
        }]);

      if (error) throw error;
      setIsReplying(false);
      
      toast({
        title: 'Success',
        description: 'Reply posted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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

  const handleCopyText = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Comment text copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box pl={depth * 4}>
      <Box p={4} bg={depth % 2 === 0 ? 'gray.50' : 'white'} borderRadius="md">
        <VStack align="stretch" spacing={3}>
          <HStack spacing={3} align="start">
            <Avatar size="sm" src={author?.avatar_url} name={author?.full_name} />
            <Box flex={1}>
              <HStack justify="space-between" mb={1}>
                <HStack>
                  <Text fontWeight="bold">{author?.full_name}</Text>
                  <Text color="gray.500">@{author?.username}</Text>
                </HStack>
                <Text color="gray.500" fontSize="sm">
                  {timestamp}
                </Text>
              </HStack>
              <Text mb={2}>{content}</Text>
              <HStack spacing={4}>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaHeart color={isLiked ? 'red.500' : 'gray.500'} />}
                  onClick={handleLike}
                >
                  {likesCount}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaReply />}
                  onClick={() => setIsReplying(true)}
                >
                  Reply
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisH />}
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                  />
                  <MenuList>
                    <MenuItem onClick={handleCopyText}>Copy Text</MenuItem>
                    <MenuItem onClick={() => {
                      toast({
                        title: 'Reported',
                        description: 'Comment has been reported',
                        status: 'info',
                        duration: 2000,
                        isClosable: true,
                      });
                    }}>Report</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Box>
          </HStack>

          {isReplying && (
            <Box pl={8}>
              <CommentComposer
                onSubmit={handleReplySubmit}
                replyingTo={author?.username}
                placeholder={`Reply to @${author?.username}...`}
              />
            </Box>
          )}
        </VStack>
      </Box>


    </Box>
  );
};

export default Comment;