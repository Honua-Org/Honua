import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ForumPostWithAuthor } from '../../types/forum';
import { useAuth } from '../../contexts/AuthContext';
import communityApi from '../../api/community';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Flex,
  Image,
  Card,
  CardBody,
  IconButton,
  Icon,
  Link,
  ButtonGroup,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, ChatIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import Navigation from '../../components/Navigation';
import TrendingTopics from '../../components/TrendingTopics';

type Community = Database['public']['Tables']['communities']['Row'];

export default function Community() {
  const { communityName } = useParams<{ communityName: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (communityName && user) {
      fetchCommunityDetails();
      checkMembership();
      checkAdminStatus();
    }
  }, [communityName, user]);

  const checkAdminStatus = async () => {
    if (!community?.id || !user?.id) return;
    try {
      const role = await communityApi.getUserRole(community.id, user.id);
      setIsAdmin(role === 'admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  useEffect(() => {
    if (community) {
      fetchPosts();
    }
  }, [community, sortBy]);

  const fetchCommunityDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('name', communityName)
        .single();

      if (error) throw error;
      setCommunity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Community not found');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', community?.id)
        .eq('user_id', session.session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsMember(!!data);
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const fetchPosts = async () => {
    if (!community) return;

    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          media_url,
          created_at,
          updated_at,
          author_id,
          community_id,
          karma_score,
          comment_count,
          post_type,
          is_pinned,
          is_locked,
          author:profiles!author_id(username)
        `)
        .eq('community_id', community.id);

      switch (sortBy) {
        case 'hot':
          query = query.order('karma_score', { ascending: false });
          break;
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'top':
          query = query.order('karma_score', { ascending: false }).limit(10);
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data?.map(post => ({
        ...post,
        author: post.author?.[0] || null
      })) || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{ community_id: community?.id }]);

      if (error) throw error;
      setIsMember(true);
      fetchCommunityDetails(); // Refresh member count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join community');
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </Box>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  if (error || !community) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
              <div className="text-red-500">{error || 'Community not found'}</div>
            </Box>
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
          <Box minH="100vh" bg="gray.50">
            {/* Community Header */}
            <Box bg="white" borderBottomWidth="1px">
              <Box h="32" bg="gray.200" position="relative">
                {community.banner_url && (
                  <Image
                    src={community.banner_url}
                    alt={`${community.name} banner`}
                    objectFit="cover"
                    w="full"
                    h="full"
                  />
                )}
              </Box>
              
              <Container maxW="container.xl" py={4} px={4}>
                <Flex align="start">
                  <Box flex="1">
                    <Heading as="h1" size="lg">{community.name}</Heading>
                    <Text color="gray.600" mt={2}>{community.description}</Text>
                    <HStack mt={4} spacing={4}>
                      <Text fontSize="sm" color="gray.500">
                        {community.member_count} members
                      </Text>
                      {!isMember && !isAdmin && (
                        <Button
                          onClick={handleJoinCommunity}
                          colorScheme="brand"
                          size="md"
                          borderRadius="full"
                        >
                          Join Community
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          as={RouterLink}
                          to={`/communities/${community.name}/edit`}
                          colorScheme="brand"
                          size="md"
                          borderRadius="full"
                        >
                          Edit Community
                        </Button>
                      )}
                    </HStack>
                  </Box>
                  {isMember && (
                    <Button
                      as={RouterLink}
                      to={`/communities/${community.name}/submit`}
                      colorScheme="brand"
                      size="md"
                      borderRadius="full"
                    >
                      Create Post
                    </Button>
                  )}
                </Flex>
              </Container>
            </Box>

      {/* Post Sorting */}
      <Container maxW="container.xl" py={2} px={4}>
        <Card mb={4} variant="outline">
          <CardBody py={2} px={4}>
            <ButtonGroup spacing={2}>
              <Button
                variant={sortBy === 'hot' ? 'solid' : 'ghost'}
                onClick={() => setSortBy('hot')}
                borderRadius="full"
                size="sm"
              >
                Hot
              </Button>
              <Button
                variant={sortBy === 'new' ? 'solid' : 'ghost'}
                onClick={() => setSortBy('new')}
                borderRadius="full"
                size="sm"
              >
                New
              </Button>
              <Button
                variant={sortBy === 'top' ? 'solid' : 'ghost'}
                onClick={() => setSortBy('top')}
                borderRadius="full"
                size="sm"
              >
                Top
              </Button>
            </ButtonGroup>
          </CardBody>
        </Card>

        {/* Posts List - Scrollable Container */}
        <Box 
          maxH="calc(100vh - 250px)" 
          overflowY="auto" 
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
              background: 'rgba(0,0,0,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '24px',
            },
          }}
        >
          <VStack spacing={4} align="stretch" pb={4}>
            {posts.map((post) => (
            <Card key={post.id}>
              <CardBody>
                <HStack align="start" spacing={4}>
                  <VStack spacing={1} align="center">
                    <IconButton
                      aria-label="Upvote"
                      icon={<ChevronUpIcon />}
                      variant="ghost"
                      color="gray.500"
                      _hover={{ color: 'brand.500' }}
                    />
                    <Text fontSize="sm" fontWeight="semibold">{post.karma_score}</Text>
                    <IconButton
                      aria-label="Downvote"
                      icon={<ChevronDownIcon />}
                      variant="ghost"
                      color="gray.500"
                      _hover={{ color: 'red.500' }}
                    />
                  </VStack>
                  <Box flex="1">
                    <Link
                      as={RouterLink}
                      to={`/communities/${communityName}/posts/${post.id}`}
                      fontSize="xl"
                      fontWeight="semibold"
                      _hover={{ color: 'brand.500' }}
                    >
                      {post.title}
                    </Link>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Posted by {post.author?.username} •{' '}
                      {new Date(post.created_at).toLocaleDateString()}
                    </Text>
                    {post.content && (
                      <Text mt={2} color="gray.700" noOfLines={3}>
                        {post.content}
                      </Text>
                    )}
                    {post.media_url && (
                      <Box mt={2}>
                        <Grid templateColumns={`repeat(${Math.min(2, (post.media_url || []).length)}, 1fr)`} gap={2}>
                          {(post.media_url || []).slice(0, 4).map((url: string, index: number) => (
                            <Box
                              key={index}
                              position="relative"
                              height="200px"
                              gridColumn={post.media_url && post.media_url.length === 1 ? "span 2" : "auto"}
                            >
                              <Image
                                src={url}
                                alt={`Post media ${index + 1}`}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                borderRadius="lg"
                              />
                              {index === 3 && post.media_url && post.media_url.length > 4 && (
                                <Box
                                  position="absolute"
                                  top={0}
                                  left={0}
                                  right={0}
                                  bottom={0}
                                  bg="blackAlpha.600"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  borderRadius="lg"
                                >
                                  <Text color="white" fontSize="xl" fontWeight="bold">
                                    +{post.media_url.length - 4}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Grid>
                      </Box>
                    )}
                    <HStack mt={4} spacing={4} color="gray.500" fontSize="sm">
                      <Link
                        as={RouterLink}
                        to={`/communities/${communityName}/post/${post.id}`}
                        display="flex"
                        alignItems="center"
                        _hover={{ color: 'brand.500' }}
                      >
                        <Icon as={ChatIcon} mr={1} />
                        <Text>{post.comment_count} Comments</Text>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ExternalLinkIcon />}
                        _hover={{ color: 'brand.500' }}
                      >
                        Share
                      </Button>
                    </HStack>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
        </GridItem>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <TrendingTopics />
        </GridItem>
      </Grid>
    </Container>
  );
}
