import { useState, useEffect, useCallback } from 'react';
import socialApi from '../api/social';
import { useAuth } from '../contexts/AuthContext';
import { getRelativeTime } from '../utils/timeUtils';
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
  Button,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import ImageModal from './ImageModal';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRetweet, FaComment, FaShare, FaEllipsisV, FaEdit, FaTrash, FaBookmark, FaFlag } from 'react-icons/fa';
import ShareModal from './ShareModal';
import { extractLinkPreviews, LinkPreview } from '../utils/linkPreview';

interface PostProps {
  id: string;
  author: {
    id: string;
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
  poll?: {
    poll_id: string;
    question: string;
    options: { text: string; votes: number }[];
    ends_at: string;
  };
  onView?: () => void;
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
  poll,
  onView,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [pollVotes, setPollVotes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (onView) {
      onView();
    }
  }, [onView]);
  const [isReposted, setIsReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [repostsCount, setRepostsCount] = useState(reposts_count);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();



  useEffect(() => {
  const fetchData = async () => {
    try {
      const previews = await extractLinkPreviews(content);
      setLinkPreviews(previews);

      if (user && id && typeof id === 'string') {
        const { isLiked: likedStatus, isReposted: repostedStatus } =
          await socialApi.getInteractionStatus(id, user.id);
        setIsLiked(likedStatus);
        setIsReposted(repostedStatus);

        // Initialize poll votes
        if (poll) {
          const votes: { [key: string]: number } = {};
          poll.options.forEach(option => {
            votes[option.text] = option.votes;
          });
          setPollVotes(votes);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  fetchData();
}, [content, id, user, poll]);

  const handleLike = useCallback(async () => {
    if (!id?.trim()) {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
      console.error('Error liking post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to like post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [id, user, likesCount, toast]);

  const handleRepost = useCallback(async () => {
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

    if (!id?.trim()) {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
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
      console.error('Error reposting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to repost',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [id, user, repostsCount, toast]);

  const handleComment = useCallback(() => {
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
  }, [user, navigate, id]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      mb={4}
      bg="gray.800"
      color="gray.100"
      borderColor="gray.600"
      shadow="md"
      _hover={{ shadow: 'lg', cursor: 'pointer', borderColor: 'gray.500' }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button, a, textarea')) {
          navigate(`/post/${id}`);
        }
      }}
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
              navigate(`/${author.username}`);
            }}
            cursor="pointer"
          />
          <VStack 
            align="start" 
            spacing={0} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${author.username}`);
            }}
            cursor="pointer"
          >
            <Text fontWeight="bold" color="white" fontSize="md">{author.full_name}</Text>
            <Text color="gray.300" fontSize="sm">@{author.username}</Text>
          </VStack>
          <Text color="gray.300" fontSize="sm" ml="auto">
            {getRelativeTime(timestamp)}
          </Text>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Post options"
              icon={<Icon as={FaEllipsisV} />}
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList onClick={(e) => e.stopPropagation()}>
              {user?.id === author.id ? (
                <>
                  <MenuItem
                    icon={<Icon as={FaEdit} />}
                    onClick={() => {
                      setIsEditing(true);
                      setEditContent(content);
                    }}
                  >
                    Edit Post
                  </MenuItem>
                  <MenuItem
                    icon={<Icon as={FaTrash} />}
                    onClick={async () => {
                      try {
                        if (!id || !user?.id) {
                          throw new Error('Invalid post ID or user authentication');
                        }

                        await socialApi.deletePost(id, user.id);
                        
                        toast({
                          title: "Success",
                          description: "Post deleted successfully",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                        
                        navigate("/");
                      } catch (error) {
                        console.error('Error deleting post:', error);
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to delete post",
                          status: "error",
                          duration: 3000,
                          isClosable: true,
                        });
                      }
                    }}
                  >
                    Delete Post
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem
                    icon={<Icon as={FaBookmark} />}
                    onClick={() => {
                      // TODO: Implement bookmark functionality
                      toast({
                        title: "Coming Soon",
                        description: "Bookmark functionality will be available soon",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  >
                    Bookmark Post
                  </MenuItem>
                  <MenuItem
                    icon={<Icon as={FaShare} />}
                    onClick={handleShare}
                  >
                    Share Post
                  </MenuItem>
                  <MenuItem
                    icon={<Icon as={FaFlag} />}
                    onClick={() => {
                      // TODO: Implement report functionality
                      toast({
                        title: "Coming Soon",
                        description: "Report functionality will be available soon",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  >
                    Report Post
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>
        </HStack>

        {/* Post Content */}
        {isEditing ? (
          <Box onClick={(e) => e.stopPropagation()}>
            <textarea
              id="edit-post-content"
              name="post-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "8px",
                marginBottom: "8px",
                borderRadius: "4px",
                border: "1px solid #E2E8F0",
              }}
            />
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={async () => {
                  try {
                    if (!id || typeof id !== 'string' || !id.trim()) {
                      throw new Error('Invalid post ID');
                    }

                    if (!user) {
                      throw new Error('User authentication required');
                    }

                    await socialApi.editPost(id, user.id, editContent);
                    toast({
                      title: "Success",
                      description: "Post updated successfully",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    setIsEditing(false);
                  } catch (error) {
                    console.error('Error editing post:', error);
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to update post",
                      status: "error",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                }}
              >
                Cancel
              </Button>
            </HStack>
          </Box>
        ) : (
          <Text color="gray.100" fontSize="md" lineHeight="tall">
            {content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
              if (part.match(/^https?:\/\//)) {
                return (
                  <Link
                    key={index}
                    href={part}
                    color="blue.300"
                    isExternal
                    onClick={(e) => e.stopPropagation()}
                    _hover={{ color: 'blue.200', textDecoration: 'underline' }}
                  >
                    {part}
                  </Link>
                );
              }
              return part;
            })}
          </Text>
        )}

        {/* Media Content */}
        {media_urls && media_urls.length > 0 && (
          <Box borderRadius="md" overflow="hidden">
            <Grid
              templateColumns={media_urls.length === 1 ? '1fr' :
                media_urls.length === 2 ? 'repeat(2, 1fr)' :
                media_urls.length === 3 ? 'repeat(2, 1fr)' :
                'repeat(2, 1fr)'}
              gap={2}
              templateRows={media_urls.length === 3 ? '200px 200px' : '200px'}
              templateAreas={media_urls.length === 3 ?
                `"img1 img2"
                 "img3 img3"` :
                undefined}
            >
              {media_urls.map((url, index) => (
                <GridItem
                  key={`${id}-media-${index}`}
                  area={media_urls.length === 3 ? `img${index + 1}` : undefined}
                >
                  {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image
                      src={url}
                      alt="Post media"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                        setIsImageModalOpen(true);
                      }}
                    />
                  ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <Box h="100%" position="relative">
                      <video
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <source src={url} />
                      </video>
                    </Box>
                  ) : null}
                </GridItem>
              ))}
            </Grid>
          </Box>
        )}

        {/* Poll */}
        {poll && (
          <Box
            mt={4}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            borderColor="gray.200"
          >
            <Text fontWeight="bold" mb={3}>
              {poll.question}
            </Text>
            <VStack spacing={3} align="stretch">
              {poll.options.map((option, index) => {
                const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
                const percentage = totalVotes > 0 ? (pollVotes[option.text] / totalVotes) * 100 : 0;
                
                return (
                  <Box key={index} position="relative">
                    <Button
                      width="100%"
                      height="40px"
                      variant="outline"
                      onClick={async () => {
                        if (!user) {
                          toast({
                            title: 'Authentication Required',
                            description: 'Please sign in to vote',
                            status: 'warning',
                            duration: 3000,
                            isClosable: true,
                          });
                          return;
                        }
                        try {
                          // Update vote in the backend
                          await socialApi.votePoll(poll.poll_id, option.text, user.id);
                          
                          // Update local state
                          setPollVotes(prev => ({
                            ...prev,
                            [option.text]: prev[option.text] + 1
                          }));
                          
                          toast({
                            title: 'Vote Recorded',
                            description: 'Your vote has been recorded successfully',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                          });
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to record your vote',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      }}
                    >
                      <Text>{option.text}</Text>
                    </Button>
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      height="100%"
                      width={`${percentage}%`}
                      bg="blue.100"
                      opacity={0.3}
                      borderRadius="md"
                      transition="width 0.3s ease-in-out"
                    />
                    <Text
                      position="absolute"
                      right={2}
                      top="50%"
                      transform="translateY(-50%)"
                      fontSize="sm"
                      color="gray.500"
                    >
                      {percentage.toFixed(1)}%
                    </Text>
                  </Box>
                );
              })}
            </VStack>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Total votes: {Object.values(pollVotes).reduce((a, b) => a + b, 0)}
            </Text>
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
                  <HStack spacing={4} p={3} align="start">
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
                      {preview.description && (
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {preview.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {preview.siteName || new URL(preview.url).hostname}
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

            <Tooltip label="Share" placement="top">
              <IconButton
                aria-label="Share"
                icon={<Icon as={FaShare} color="gray.500" />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              />
            </Tooltip>
          </HStack>
      </VStack>
      {media_urls && media_urls.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={media_urls.filter(url => url.match(/\.(jpg|jpeg|png|gif)$/i))}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postId={id}
        postUrl={`${window.location.origin}/post/${id}`}
      />
    </Box>
  );
};

export default Post;