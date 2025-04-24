import {
  VStack,
  HStack,
  Heading,
  Box,
  Text,
  Button,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaHashtag, FaChartLine } from 'react-icons/fa';

interface TrendingTopic {
  tag: string;
  count: number;
  category?: string;
}

const TrendingTopics = () => {
  // TODO: Fetch trending topics from backend
  const trendingTopics: TrendingTopic[] = [
    { tag: 'Technology', count: 12500, category: 'Tech' },
    { tag: 'Sustainability', count: 8900, category: 'Environment' },
    { tag: 'Innovation', count: 7300, category: 'Business' },
    { tag: 'CleanEnergy', count: 6200, category: 'Environment' },
    { tag: 'FutureOfWork', count: 5100, category: 'Business' },
  ];

  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      bg={useColorModeValue('white', 'gray.800')}
    >
      <Box p={5} borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md" display="flex" alignItems="center" gap={3}>
          <Icon as={FaChartLine} />
          Trending Topics
        </Heading>
      </Box>

      <VStack spacing={0} align="stretch" py={2}>
        {trendingTopics.map((topic, index) => (
          <Button
            key={index}
            variant="ghost"
            justifyContent="flex-start"
            width="full"
            py={5}
            px={5}
            _hover={{ bg: bgHover }}
            borderBottomWidth={index < trendingTopics.length - 1 ? '1px' : '0'}
            borderColor={borderColor}
            h="auto"
          >
            <VStack align="flex-start" spacing={2} width="full">
              <Text color="gray.500" fontSize="sm" fontWeight="medium">
                {topic.category}
              </Text>
              <HStack spacing={2} width="full" justify="space-between">
                <Text fontWeight="bold" fontSize="md" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaHashtag} color="blue.500" boxSize={4} />
                  {topic.tag}
                </Text>
                <Text color="gray.500" fontSize="sm" fontWeight="medium">
                  {topic.count.toLocaleString()} posts
                </Text>
              </HStack>
            </VStack>
          </Button>
        ))}
      </VStack>

      <Box p={5} borderTopWidth="1px" borderColor={borderColor}>
        <Button variant="ghost" color="blue.500" size="sm" width="full">
          Show more
        </Button>
      </Box>
    </Box>
  );
};

export default TrendingTopics;