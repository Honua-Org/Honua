import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Text,
  Alert,
  AlertIcon,
  Card,
  CardBody,
} from '@chakra-ui/react';
import Navigation from '../../components/Navigation';
import TrendingTopics from '../../components/TrendingTopics';
import { supabase } from '../../lib/supabase';

export default function CreateCommunity() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate community name
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error('Community name can only contain letters, numbers, underscores, and hyphens');
      }

      // Create the community
      const { error: communityError } = await supabase
        .from('communities')
        .insert([
          {
            name: name.toLowerCase(),
            description,
            rules
          }
        ]);

      if (communityError) throw communityError;

      // Navigate to the new community
      navigate(`/communities/${name.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>
        <GridItem>
          <Card shadow="md" borderRadius="lg" maxH="calc(100vh - 100px)" display="flex" flexDirection="column">
            <CardBody p={6} overflowY="auto" css={{
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
            }}>
              <Heading as="h1" size="lg" mb={6}>Create a Community</Heading>

              {error && (
                <Alert status="error" mb={4} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <FormControl mb={4}>
                  <FormLabel htmlFor="name" fontWeight="bold">Name</FormLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="community_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Text mt={1} fontSize="sm" color="gray.500">
                    Community names can't be changed once created
                  </Text>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel htmlFor="description" fontWeight="bold">Description</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="What is your community about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minH="100px"
                    required
                  />
                </FormControl>

                <FormControl mb={6}>
                  <FormLabel htmlFor="rules" fontWeight="bold">Community Rules (Optional)</FormLabel>
                  <Textarea
                    id="rules"
                    placeholder="Enter your community guidelines and rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    minH="150px"
                  />
                </FormControl>

                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    isLoading={loading}
                    loadingText="Creating..."
                    colorScheme="brand"
                    borderRadius="full"
                    px={6}
                  >
                    Create Community
                  </Button>
                </Box>
              </form>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <TrendingTopics />
        </GridItem>
      </Grid>
    </Container>
  );
}
