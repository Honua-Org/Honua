import { Box, Container, Grid, GridItem } from '@chakra-ui/react';
import Navigation from '../Navigation';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={4} h="100%">
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6} minH="calc(100vh - 2rem)">
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            p={4}
            shadow="sm"
            minH="full"
          >
            {children}
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }} />
        </Grid>
      </Container>
    </Box>
  );
};

export default PageLayout;