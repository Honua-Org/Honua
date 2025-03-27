import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Badge as ChakraBadge,
  Progress,
  Heading,
  HStack,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiAward, FiUsers, FiCheckCircle, FiStar } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { Badge, User } from '../../types/user';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof FiAward;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

export const RewardsPage = () => {
  const { user, rewards, isLoading } = useAuthStore() as { user: User | null; rewards: User['rewards']; isLoading: boolean };

  if (isLoading) {
    return (
      <Box maxW="800px" mx="auto" py={8} px={4}>
        <VStack spacing={8} align="stretch">
          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <VStack spacing={4} align="stretch">
              <Heading size="lg">Your Rewards</Heading>
              <HStack justify="space-between">
                <VStack align="start">
                  <Progress size="xs" isIndeterminate w="100px" />
                  <Text color="gray.600">Total Points</Text>
                </VStack>
                <VStack align="start">
                  <Progress size="xs" isIndeterminate w="100px" />
                  <Text color="gray.600">Badges Earned</Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
          <SimpleGrid columns={[1, null, 2]} spacing={6}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} p={6} borderWidth={1} borderRadius="lg" bg="white">
                <Progress size="xs" isIndeterminate />
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  // This will be replaced with API calls
  const achievements: Achievement[] = [
    // Show personalized progress based on user's activity
    {
      id: '1',
      title: 'Social Butterfly',
      description: `${user?.user_metadata?.displayName || 'User'}, make 10 posts`,
      icon: FiStar,
      progress: user?.posts?.length || 3,
      maxProgress: 10,
      completed: (user?.posts?.length || 3) >= 10,
    },
    {
      id: '1',
      title: 'Social Butterfly',
      description: 'Make 10 posts',
      icon: FiStar,
      progress: 3,
      maxProgress: 10,
      completed: false,
    },
    {
      id: '2',
      title: 'Community Builder',
      description: `${user?.user_metadata?.displayName || 'User'}, refer 5 friends`,
      icon: FiUsers,
      progress: user?.referrals?.length || 2,
      maxProgress: 5,
      completed: (user?.referrals?.length || 2) >= 5,
    },
    {
      id: '3',
      title: 'Task Master',
      description: `${user?.user_metadata?.displayName || 'User'}, complete 20 tasks`,
      icon: FiCheckCircle,
      progress: user?.completedTasks?.length || 15,
      maxProgress: 20,
      completed: (user?.completedTasks?.length || 15) >= 20,
    },
  ];

  // Display badges based on user's achievements
  const badges: Badge[] = user?.badges || [
    { name: 'Early Adopter', color: 'purple' },
    { name: 'Top Contributor', color: 'green' },
    { name: 'Task Champion', color: 'blue' },
  ];

  return (
    <Box maxW="800px" mx="auto" py={8} px={4}>
      <VStack spacing={8} align="stretch">
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <VStack spacing={4} align="stretch">
            <Heading size="lg">Your Rewards</Heading>
            <HStack justify="space-between">
              <VStack align="start">
                <Text fontSize="2xl" fontWeight="bold">
                  {rewards?.points || 0}
                </Text>
                <Text color="gray.600">Total Points</Text>
              </VStack>
              <VStack align="start">
                <Text fontSize="2xl" fontWeight="bold">
                  {badges.length}
                </Text>
                <Text color="gray.600">Badges Earned</Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Your Badges</Heading>
          <HStack spacing={4} wrap="wrap">
            {badges.map((badge) => (
              // Update Badge usage in JSX
                      <ChakraBadge
                        key={badge.name}
                        colorScheme={badge.color}
                        p={2}
                        borderRadius="full"
                        fontSize="sm"
                      >
                        {badge.name}
                      </ChakraBadge>
            ))}
          </HStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Achievements</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {achievements.map((achievement) => (
              <Box
                key={achievement.id}
                p={4}
                borderWidth={1}
                borderRadius="lg"
                bg="white"
              >
                <HStack spacing={4}>
                  <Icon
                    as={achievement.icon}
                    boxSize={6}
                    color={achievement.completed ? 'green.500' : 'gray.500'}
                  />
                  <VStack align="start" flex={1} spacing={2}>
                    <Tooltip label={achievement.description}>
                      <Text fontWeight="bold">{achievement.title}</Text>
                    </Tooltip>
                    <Progress
                      value={(achievement.progress / achievement.maxProgress) * 100}
                      size="sm"
                      width="100%"
                      colorScheme={achievement.completed ? 'green' : 'blue'}
                    />
                    <Text fontSize="sm" color="gray.600">
                      {achievement.progress} / {achievement.maxProgress}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>
    </Box>
  );
};