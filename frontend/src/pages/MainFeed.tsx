import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  Button,
  useDisclosure,
  Icon,
  Select,
  HStack,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaSearch, FaPlus, FaFilter } from 'react-icons/fa';
import { useInfiniteQuery } from '@tanstack/react-query';
import Navigation from '../components/Navigation';
import TrendingTopics from '../components/TrendingTopics';
import PostComponent from '../components/Post';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../contexts/AuthContext';
import postsApi from '../api/posts';
import { Post } from '../types/post';
import { useState } from 'react';

interface PostResponse {
  posts: Post[];
  hasMore: boolean;
}

const MainFeed = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<string>('latest');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const lastPostRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['posts', filter, searchQuery],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await postsApi.getPosts(pageParam);
      return response;
    },
    getNextPageParam: (lastPage: PostResponse) => {
      return lastPage.hasMore ? lastPage.posts.length : undefined;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (lastPostRef.current) {
      observer.observe(lastPostRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCreatePost = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a post',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onOpen();
  };

  const handlePostCreated = () => {
    // Invalidate and refetch posts query to include the new post
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  const allPosts = data?.pages.flatMap(page => page.posts) || [];

  return (
    <Container maxW="container.xl" py={4}>
      <Grid
        templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }}
        gap={6}
      >
        {/* Mobile Profile and Search */}
        <GridItem display={{ base: 'block', md: 'none' }} mb={4}>
          <VStack spacing={4} width="100%">
            <Box width="100%" px={4}>
              <Navigation />
            </Box>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </InputGroup>
          </VStack>
        </GridItem>
        {/* Navigation Menu */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        {/* Main Feed */}
        <GridItem>
          <VStack spacing={4} align="stretch" height="calc(100vh - 2rem)" overflow="hidden">
            {/* Search and Filter - Desktop Only */}
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.500" />
                </InputLeftElement>
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </InputGroup>
              <Select
                w="150px"
                value={filter}
                onChange={handleFilterChange}
                icon={<FaFilter />}
              >
                <option value="latest">Latest</option>
                <option value="trending">Trending</option>
                <option value="top">Top</option>
              </Select>
            </HStack>

            {/* Floating Action Button */}
            <Box
              as={motion.div}
              position="fixed"
              bottom="4rem"
              right="4rem"
              zIndex={1000}
            >
              <Button
                as={motion.button}
                colorScheme="blue"
                borderRadius="full"
                height="56px"
                display="flex"
                alignItems="center"
                px={4}
                onClick={handleCreatePost}
                whileHover={{ scale: 1.05, width: '180px' }}
                initial={{ width: '56px', scale: 1 }}
                transition="all 0.2s"
                boxShadow="lg"
              >
                <Icon as={FaPlus} boxSize={5} />
                <Text
                  as={motion.span}
                  ml={2}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition="all 0.2s"
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  Create Post
                </Text>
              </Button>
            </Box>

            {/* Post Feed */}
            <VStack spacing={4} align="stretch" flex="1" overflow="auto" css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.3)',
              },
            }}>
              {allPosts.map((post: Post, index) => (
                <Box
                  key={`${post.id}-${index}`}
                  ref={index === allPosts.length - 1 ? lastPostRef : null}
                >
                  <PostComponent {...post} />
                </Box>
              ))}
              {isLoading && (
                <Box textAlign="center" py={4}>
                  <Spinner size="lg" />
                </Box>
              )}
              {!isLoading && !hasNextPage && (
                <Text textAlign="center" color="gray.500">
                  No more posts to load
                </Text>
              )}
            </VStack>
          </VStack>
        </GridItem>

        {/* Trending Topics */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <TrendingTopics />
          </Box>
        </GridItem>
      </Grid>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={isOpen} onClose={onClose} onPostCreated={handlePostCreated} />
    </Container>
  );
};

export default MainFeed;