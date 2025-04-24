import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';

const Home = () => {
  return (
    <Container maxW="container.xl" py={{ base: '16', md: '24' }}>
      <Stack spacing="12" align="center" textAlign="center">
        <VStack spacing="6">
          <Heading
            as="h1"
            size={{ base: '2xl', md: '4xl' }}
            fontWeight="bold"
            color="blue.600"
          >
            Welcome to Honua Social
          </Heading>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            color="gray.600"
            maxW="2xl"
          >
            Connect, share, and engage with a community that cares about making a positive impact on our world.
          </Text>
        </VStack>

        <Box
          w="full"
          maxW="md"
          p={{ base: '6', md: '8' }}
          bg="white"
          boxShadow="xl"
          rounded="xl"
        >
          <VStack spacing="4">
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="blue"
              size="lg"
              width="full"
              fontSize="md"
            >
              Sign In
            </Button>
            <Button
              as={RouterLink}
              to="/register"
              variant="outline"
              colorScheme="blue"
              size="lg"
              width="full"
              fontSize="md"
            >
              Create Account
            </Button>
          </VStack>
        </Box>
      </Stack>
    </Container>
  );
};

export default Home;