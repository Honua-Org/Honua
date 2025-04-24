import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  Text,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import Navigation from '../../components/Navigation';
import TrendingTopics from '../../components/TrendingTopics';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type Community = Database['public']['Tables']['communities']['Row'];

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch communities',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{ community_id: communityId }]);

      if (error) throw error;
      fetchCommunities();
      toast({
        title: 'Success',
        description: 'Successfully joined the community',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to join community',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
              <Spinner size="xl" />
            </Box>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  if (error) {
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
              <Text color="red.500">{error}</Text>
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
          <HStack justify="space-between" mb={8}>
            <Heading size="lg">Communities</Heading>
            <Button
              as={RouterLink}
              to="/communities/create"
              colorScheme="blue"
            >
              Create Community
            </Button>
          </HStack>

           <Grid
             templateColumns={{
               base: '1fr',
               md: 'repeat(2, 1fr)',
               lg: 'repeat(3, 1fr)'
             }}
             gap={6}
           >
             {communities.map((community) => (
               <Box
                 key={`community-${community.id}-${community.name}`}
                 borderWidth="1px"
                 borderRadius="lg"
                 overflow="hidden"
                 bg="white"
                 _dark={{ bg: 'gray.800' }}
               >
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
                   {community.avatar_url && (
                     <Image
                       src={community.avatar_url}
                       alt={`${community.name} avatar`}
                       position="absolute"
                       bottom="-6"
                       left="4"
                       w="16"
                       h="16"
                       borderRadius="full"
                       borderWidth="4px"
                       borderColor="white"
                       _dark={{ borderColor: 'gray.800' }}
                     />
                   )}
                 </Box>

                 <Box p={4} pt={8}>
                   <RouterLink to={`/communities/${community.name}`}>
                     <Heading
                       size="md"
                       _hover={{ color: 'blue.500' }}
                       noOfLines={1}
                     >
                       {community.name}
                     </Heading>
                   </RouterLink>
                   <Text
                     color="gray.600"
                     _dark={{ color: 'gray.400' }}
                     mt={2}
                     noOfLines={2}
                   >
                     {community.description}
                   </Text>
                   <HStack mt={4} justify="space-between">
                     <Text
                       fontSize="sm"
                       color="gray.500"
                       _dark={{ color: 'gray.400' }}
                     >
                       {community.member_count} members
                     </Text>
                     <Button
                       onClick={() => handleJoinCommunity(community.id)}
                       colorScheme="blue"
                       size="sm"
                       borderRadius="full"
                     >
                       Join
                     </Button>
                   </HStack>
                 </Box>
               </Box>
             ))}
           </Grid>
         </GridItem>
         <GridItem display={{ base: 'none', md: 'block' }}>
           <TrendingTopics />
         </GridItem>
       </Grid>
     </Container>
   );
}