import { ReactNode } from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiHome, FiCompass, FiCheckSquare, FiAward } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, rewards, signOut, isLoading, error } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');

  if (isLoading) {
    return (
      <Flex minH="100vh" justify="center" align="center">
        <Text>Loading...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" justify="center" align="center" direction="column" gap={4}>
        <Text color="red.500">Error: {error}</Text>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={pageBgColor} w="100%">
      <Flex
        as="header"
        position="fixed"
        w="100%"
        maxW="100%"
        bg={bgColor}
        boxShadow="sm"
        zIndex={1}
        h="60px"
        alignItems="center"
        justifyContent="center"
        px={4}
      >
        <Flex w="100%" maxW="container.xl" alignItems="center">
          <Text fontSize="xl" fontWeight="bold" as={RouterLink} to="/">
            Honua Social
          </Text>
          <HStack spacing={4} ml="auto">
            {user ? (
              <>
                <IconButton
                  as={RouterLink}
                  to="/"
                  aria-label="Home"
                  icon={<FiHome />}
                  variant="ghost"
                />
                <IconButton
                  as={RouterLink}
                  to="/explore"
                  aria-label="Explore"
                  icon={<FiCompass />}
                  variant="ghost"
                />
                <IconButton
                  as={RouterLink}
                  to="/tasks"
                  aria-label="Tasks"
                  icon={<FiCheckSquare />}
                  variant="ghost"
                />
                <IconButton
                  as={RouterLink}
                  to="/rewards"
                  aria-label="Rewards"
                  icon={<FiAward />}
                  variant="ghost"
                />
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded="full"
                    variant="link"
                    cursor="pointer"
                    minW={0}
                  >
                    <Avatar size="sm" name={user.user_metadata?.name || undefined} src={user.user_metadata?.avatar_url || undefined} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/profile">
                      Profile
                    </MenuItem>
                    {rewards && (
                      <MenuItem as={RouterLink} to="/rewards">
                        Points: {rewards.points}
                      </MenuItem>
                    )}
                    <MenuItem onClick={signOut}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Button as={RouterLink} to="/signin" variant="ghost">
                  Sign In
                </Button>
                <Button as={RouterLink} to="/signup" colorScheme="blue">
                  Sign Up
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Flex>
      <Box as="main" pt="60px" minH="calc(100vh - 60px)" w="100%" bg={pageBgColor}>
        <Flex
          w="100%"
          maxW="container.xl"
          mx="auto"
          px={4}
          py={8}
          direction="column"
          alignItems="stretch"
          flex="1"
        >
          {children}
        </Flex>
      </Box>
    </Box>
  );
};