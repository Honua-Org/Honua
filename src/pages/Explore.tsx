import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Tag,
  TagLabel,
  Avatar,
  Button,
  Select,
  useColorModeValue,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { FaSearch, FaFire, FaHashtag } from 'react-icons/fa';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import Navigation from '../components/Navigation';
import Post from '../components/Post';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

interface Post {
  post_id: string;
  content: string;
  image_urls: string[];
  video_urls: string[];
  poll_id: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  save_count: number;
  view_count: number;
  trending_score: number;
  content_score: number;
  category: string[];
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
  };
}

interface ExploreFeedResponse {
  status: string;
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
  };
}

interface TrendingTopic {
  id: string;
  name: string;
  postCount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
}

const POSTS_PER_PAGE = 20;

const Explore = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const { ref, inView } = useInView();
  
  // Track post views
  const viewedPosts = useRef<Set<string>>(new Set());

  const fetchExploreFeed = async ({ pageParam = 0 }) => {
    const response = await fetch(
      `/api/explore?page=${pageParam}&limit=${POSTS_PER_PAGE}&filter=${selectedFilter}&category=${selectedCategory}&timeframe=${selectedTimeframe}&search=${searchQuery}&user_id=${user?.id || ''}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json() as Promise<ExploreFeedResponse>;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['exploreFeed', selectedFilter, selectedCategory, selectedTimeframe, searchQuery],
    queryFn: ({ pageParam }) => fetchExploreFeed({ pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.pagination.page + 1;
      return lastPage.data.length === POSTS_PER_PAGE ? nextPage : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateEngagementMetrics = useCallback(async (postId: string, metricType: string, value: number) => {
    try {
      await fetch('/api/explore/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, metric_type: metricType, value })
      });
    } catch (error) {
      console.error('Failed to update engagement metrics:', error);
      toast({
        title: 'Error updating engagement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Handle post view tracking
  const handlePostView = useCallback((postId: string) => {
    if (!viewedPosts.current.has(postId)) {
      viewedPosts.current.add(postId);
      updateEngagementMetrics(postId, 'view', 1);
    }
  }, [updateEngagementMetrics]);

  // Load more posts when reaching the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Refetch when filter or search changes
  useEffect(() => {
    refetch();
  }, [selectedFilter, searchQuery, refetch]);

  const trendingTopics: TrendingTopic[] = [
    { id: '1', name: 'Technology', postCount: 1234 },
    { id: '2', name: 'Climate', postCount: 890 },
    { id: '3', name: 'Innovation', postCount: 567 },
  ];

  const categories: Category[] = [
    { id: '1', name: 'Technology', icon: '💻' },
    { id: '2', name: 'Science', icon: '🔬' },
    { id: '3', name: 'Art', icon: '🎨' },
    { id: '4', name: 'Music', icon: '🎵' },
  ];

  const suggestedUsers: SuggestedUser[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice_tech',
      avatar: 'https://bit.ly/alice-avatar',
      bio: 'Tech enthusiast | AI researcher',
    },
    {
      id: '2',
      name: 'Bob Smith',
      username: 'bob_creates',
      avatar: 'https://bit.ly/bob-avatar',
      bio: 'Digital artist | Creator',
    },
  ];

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        {/* Navigation Menu */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
            <VStack spacing={4} mt={8} align="stretch">
              <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px">
                <Heading size="sm" mb={4}>Filters</Heading>
                <VStack spacing={3} align="stretch">
                  <Select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    placeholder="Sort by"
                  >
                    <option value="trending">Trending</option>
                    <option value="engagement">Most Engaging</option>
                    <option value="quality">Highest Quality</option>
                    <option value="latest">Latest</option>
                  </Select>
                  
                  <Select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    placeholder="Time Range"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </Select>

                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    placeholder="All Categories"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.name.toLowerCase()}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </Select>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </GridItem>

        {/* Main Content */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            {/* Search and Filters */}
            <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search posts, topics, or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
                <HStack spacing={4}>
                  <Select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    width="auto"
                  >
                    <option value="latest">Latest</option>
                    <option value="popular">Popular</option>
                    <option value="media">Media</option>
                  </Select>
                </HStack>
              </VStack>
            </Box>

            {/* Posts */}
            {status === 'error' ? (
              <Box p={4} bg="red.100" color="red.900" borderRadius="md">
                Error: {(error as Error).message}
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {data?.pages.map((page, i) => (
                  <React.Fragment key={i}>
                    {page.data.map((post: Post) => (
                      <Post
                        key={post.post_id}
                        id={post.post_id}
                        author={{
                          id: post.user.id,
                          full_name: post.user.full_name,
                          username: post.user.username,
                          avatar_url: post.user.avatar_url,
                        }}
                        content={post.content}
                        media_urls={[
                          ...post.image_urls,
                          ...post.video_urls
                        ]}
                        likes_count={post.likes_count}
                        reposts_count={post.reposts_count}
                        comments_count={post.comments_count}
                        timestamp={new Date(post.created_at).toLocaleString()}
                        onView={() => handlePostView(post.post_id)}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </VStack>
            )}
            
            {/* Load more trigger */}
            <Box ref={ref} h="10" mt={4}>
              {isFetchingNextPage && (
                <HStack justify="center">
                  <Text>Loading more posts...</Text>
                </HStack>
              )}
            </Box>
          </VStack>
        </GridItem>

        {/* Sidebar */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <VStack spacing={6} position="sticky" top={4}>
            {/* Trending Topics */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>
                <HStack>
                  <Icon as={FaFire} color="orange.500" />
                  <Text>Trending Topics</Text>
                </HStack>
              </Heading>
              <VStack align="stretch" spacing={3}>
                {trendingTopics.map((topic) => (
                  <HStack key={topic.id} justify="space-between">
                    <HStack>
                      <Icon as={FaHashtag} color="gray.500" />
                      <Text>{topic.name}</Text>
                    </HStack>
                    <Text color="gray.500" fontSize="sm">
                      {topic.postCount} posts
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Categories */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>Categories</Heading>
              <HStack spacing={2} flexWrap="wrap">
                {categories.map((category) => (
                  <Tag
                    key={category.id}
                    size="lg"
                    borderRadius="full"
                    variant="subtle"
                    colorScheme="blue"
                    cursor="pointer"
                    _hover={{ bg: 'blue.100' }}
                  >
                    <TagLabel>
                      {category.icon} {category.name}
                    </TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            {/* Suggested Users */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>Suggested Users</Heading>
              <VStack spacing={4} align="stretch">
                {suggestedUsers.map((user) => (
                  <HStack key={user.id} spacing={3}>
                    <Avatar size="sm" src={user.avatar} name={user.name} />
                    <Box flex={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {user.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        @{user.username}
                      </Text>
                    </Box>
                    <Button size="sm" colorScheme="blue" variant="outline">
                      Follow
                    </Button>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default Explore;