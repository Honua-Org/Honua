import { useState, useEffect } from 'react';
import socialApi from '../api/social';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Icon,
  Avatar,
  Link,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRetweet, FaComment, FaShare } from 'react-icons/fa';
import { extractLinkPreviews, LinkPreview } from '../utils/linkPreview';

interface PostProps {
  id: string;
  author: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  content: string;
  media_urls?: string[];
  linkPreviews?: LinkPreview[];
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  timestamp: string;
}

const Post = ({
  id,
  author,
  content,
  media_urls,
  likes_count,
  reposts_count,
  comments_count,
  timestamp,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [repostsCount, setRepostsCount] = useState(reposts_count);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLinkPreviews = async () => {
      try {
        const previews = await extractLinkPreviews(content);
        setLinkPreviews(previews);
      } catch (error) {
        console.error('Error extracting link previews:', error);
      }
    };

    const fetchInteractionStatus = async () => {
      if (user) {
        try {
          const { isLiked: likedStatus, isReposted: repostedStatus } = 
            await socialApi.getInteractionStatus(id, user.id);
          setIsLiked(likedStatus);
          setIsReposted(repostedStatus);
        } catch (error) {
          console.error('Error fetching interaction status:', error);
        }
      }
    };

    fetchLinkPreviews();
    fetchInteractionStatus();
  }, [content, id, user]);
  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to like posts',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { success, isLiked: newLikeState } = await socialApi.toggleLike(id, user.id);
      if (success) {
        setIsLiked(newLikeState);
        setLikesCount(newLikeState ? likesCount + 1 : likesCount - 1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRepost = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to repost',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { success, isReposted: newRepostState } = await socialApi.toggleRepost(id, user.id);
      if (success) {
        setIsReposted(newRepostState);
        setRepostsCount(newRepostState ? repostsCount + 1 : repostsCount - 1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to repost',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComment = () => {
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
    navigate(`/post/${id}#comments`);
  };

  const handleShare = async () => {
    try {
      const { url } = await socialApi.sharePost(id);
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Post link copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      bg="white"
      _hover={{ shadow: 'md', cursor: 'pointer' }}
      onClick={() => navigate(`/post/${id}`)}
    >
      <VStack align="stretch" spacing={4}>
        {/* Author Info */}
        <HStack spacing={3}>
          <Avatar 
            size="md" 
            src={author.avatar_url} 
            name={author.full_name} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${author.username}`);
            }}
            cursor="pointer"
          />
          <VStack 
            align="start" 
            spacing={0} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${author.username}`);
            }}
            cursor="pointer"
          >
            <Text fontWeight="bold">{author.full_name}</Text>
            <Text color="gray.500">@{author.username}</Text>
          </VStack>
          <Text color="gray.500" fontSize="sm" ml="auto">
            {timestamp}
          </Text>
        </HStack>

        {/* Post Content */}
        <Text>
          {content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
            if (part.match(/^https?:\/\//)) {
              return (
                <Link
                  key={index}
                  href={part}
                  color="blue.500"
                  isExternal
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </Link>
              );
            }
            return part;
          })}
        </Text>

        {/* Media Content */}
        {media_urls && media_urls.length > 0 && (
          <Box borderRadius="md" overflow="hidden">
            {media_urls.map((url, index) => (
              <Box key={`${id}-media-${index}`}>
                {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <Image src={url} alt="Post media" maxH="400px" objectFit="cover" w="100%" />
                ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    controls
                    style={{ width: '100%', maxHeight: '400px' }}
                  >
                    <source src={url} />
                  </video>
                ) : null}
              </Box>
            ))}
          </Box>
        )}

        {/* Link Previews */}
        {linkPreviews && linkPreviews.length > 0 && (
          <VStack spacing={2} align="stretch">
            {linkPreviews.map((preview: LinkPreview, index: number) => (
              <Link 
                key={`${id}-preview-${index}`} 
                href={preview.url} 
                isExternal 
                _hover={{ textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  overflow="hidden"
                  _hover={{ bg: 'gray.50' }}
                >
                  <HStack spacing={4} p={3}>
                    {preview.image && (
                      <Image 
                        src={preview.image} 
                        alt={preview.title} 
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" flex={1} spacing={1}>
                      <Text fontWeight="bold" noOfLines={2}>
                        {preview.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {preview.description}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new URL(preview.url).hostname}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Link>
            ))}
          </VStack>
        )}

        {/* Interaction Buttons */}
        <HStack spacing={4} mt={4}>
            <Tooltip label={isLiked ? 'Unlike' : 'Like'} placement="top">
              <IconButton
                aria-label={isLiked ? 'Unlike' : 'Like'}
                icon={<Icon as={FaHeart} color={isLiked ? 'red.500' : 'gray.500'} />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{likesCount}</Text>

            <Tooltip label={isReposted ? 'Undo Repost' : 'Repost'} placement="top">
              <IconButton
                aria-label={isReposted ? 'Undo Repost' : 'Repost'}
                icon={<Icon as={FaRetweet} color={isReposted ? 'green.500' : 'gray.500'} />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRepost();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{repostsCount}</Text>

            <Tooltip label="Comment" placement="top">
              <IconButton
                aria-label="Comment"
                icon={<Icon as={FaComment} color="gray.500" />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComment();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{comments_count}</Text>

            <Menu>
              <Tooltip label="Share" placement="top">
                <MenuButton
                  as={IconButton}
                  aria-label="Share options"
                  icon={<Icon as={FaShare} color="gray.500" />}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
              <MenuList onClick={(e) => e.stopPropagation()}>
                <MenuItem onClick={handleShare}>Copy Link</MenuItem>
                <MenuItem
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + `/post/${id}`)}&text=${encodeURIComponent(content)}`, '_blank')}
                >
                  Share on Twitter
                </MenuItem>
                <MenuItem
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + `/post/${id}`)}`, '_blank')}
                >
                  Share on Facebook
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
      </VStack>
    </Box>
  );
};

export default Post;