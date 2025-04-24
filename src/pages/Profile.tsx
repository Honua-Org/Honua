import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  useToast,
  useDisclosure,
  Skeleton,
} from '@chakra-ui/react';
import EditProfileModal from '../components/EditProfileModal';
import { FaEdit } from 'react-icons/fa';
import Navigation from '../components/Navigation';
import TrendingTopics from '../components/TrendingTopics';
import Post from '../components/Post';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../api/user.api';
import messagesApi from '../api/messages';

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  bio?: string;
  avatar_url: string | null;
  updated_at: string;
}

interface ProfileStats {
  followers_count: number;
  following_count: number;
}

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({ followers_count: 0, following_count: 0 });
  interface Post {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
}

const [userPosts, setUserPosts] = useState<Post[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isOwnProfile = !username || (user && profile && user.id === profile.id);

  useEffect(() => {
    fetchProfile();
  }, [user, username]);

  useEffect(() => {
    if (profile) {
      fetchProfileStats();
      fetchUserPosts();
    }
  }, [profile]);

  const fetchProfileStats = async () => {
    if (!profile) return;
    try {
      const [followers, following] = await Promise.all([
        userService.getFollowerCount(profile.id),
        userService.getFollowingCount(profile.id)
      ]);
      setProfileStats({ followers_count: followers, following_count: following });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  const fetchUserPosts = async () => {
    if (!profile) return;
    try {
      const posts = await userService.getUserPosts(profile.id);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (user && profile && !isOwnProfile) {
        const followingStatus = await userService.isFollowing(user.id, profile.id);
        setIsFollowing(followingStatus);
      }
    };
    checkFollowingStatus();
  }, [user, profile, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    try {
      if (isFollowing) {
        await userService.unfollowUser(user.id, profile.id);
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You have unfollowed ${profile.username}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await userService.followUser(user.id, profile.id);
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let profileData;
      if (username) {
        profileData = await userService.getUserProfileByUsername(username);
      } else if (user?.id) {
        profileData = await userService.getUserProfile(user.id);
      } else {
        setError('No user found');
        return;
      }
      if (!profileData) {
        setError('Profile not found');
        return;
      }
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    onOpen();
  };

  const navigate = useNavigate();

  const handleMessage = async () => {
    if (!user || !profile) return;
    try {
      const chat = await messagesApi.startChat(user.id, profile.id);
      navigate('/messages', { state: { chatId: chat.chat_id } });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const updatedProfile = await userService.getUserProfile(user?.id || '');
      setProfile(updatedProfile);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Skeleton height="200px" />
              <Skeleton height="100px" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
            </VStack>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <Text>{error || 'Profile not found'}</Text>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        <GridItem>
          <VStack spacing={4} align="stretch">
            <Box textAlign="center" pt={8}>
              <Avatar
                size="2xl"
                src={profile.avatar_url || undefined}
                name={profile.full_name || profile.username}
                mb={4}
              />
              <VStack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                  {profile.full_name}
                </Text>
                <Text color="gray.500">@{profile.username}</Text>
                
                {/* Follower/Following Stats */}
                <HStack spacing={6} justify="center">
                  <VStack>
                    <Text fontWeight="bold">{profileStats.followers_count}</Text>
                    <Text color="gray.500">Followers</Text>
                  </VStack>
                  <VStack>
                    <Text fontWeight="bold">{profileStats.following_count}</Text>
                    <Text color="gray.500">Following</Text>
                  </VStack>
                </HStack>

                {isOwnProfile && (
                  <Button
                    leftIcon={<Icon as={FaEdit} />}
                    onClick={handleEditProfile}
                    colorScheme="blue"
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                )}
                {!isOwnProfile && (
                  <HStack spacing={2}>
                    <Button
                      onClick={handleFollow}
                      colorScheme="blue"
                      variant={isFollowing ? "outline" : "solid"}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    <Button
                      colorScheme="teal"
                      onClick={handleMessage}
                      leftIcon={<Icon as={FaEdit} />}
                    >
                      Message
                    </Button>
                  </HStack>
                )}

                {profile.bio && <Text>{profile.bio}</Text>}
              </VStack>
            </Box>

            {/* Content Tabs */}
            <Tabs colorScheme="blue" mt={4}>
              <TabList>
                <Tab>Posts</Tab>
                <Tab>Replies</Tab>
                <Tab>Media</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <Box maxH="600px" overflowY="auto">
                    <VStack spacing={4} align="stretch">
                      {userPosts.length > 0 ? (
                        userPosts.map(post => (
                          <Post
                            key={post.post_id}
                            id={post.post_id}
                            author={{
                              id: profile.id,
                              full_name: profile.full_name,
                              username: profile.username,
                              avatar_url: profile.avatar_url || ''
                            }}
                            content={post.content}
                            timestamp={new Date(post.created_at).toLocaleString()}
                            likes_count={post.likes_count}
                            reposts_count={post.reposts_count}
                            comments_count={post.comments_count}
                          />
                        ))
                      ) : (
                        <Text color="gray.500">No posts yet</Text>
                      )}
                    </VStack>
                  </Box>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* TODO: Add replies content */}
                    <Text color="gray.500">No replies yet</Text>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* TODO: Add media content */}
                    <Text color="gray.500">No media yet</Text>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </GridItem>

        {/* Trending Topics Sidebar */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <TrendingTopics />
          </Box>
        </GridItem>
      </Grid>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isOpen}
        onClose={onClose}
        profile={{
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          avatar_url: profile.avatar_url || undefined
        }}
        onUpdate={handleProfileUpdate}
      />
    </Container>
  );
};

export default Profile;