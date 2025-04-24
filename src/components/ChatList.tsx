import {
  VStack,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
  Avatar,
  AvatarBadge,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ChatListProps } from '../types/messages';

interface ChatPreview {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

const ChatList = ({ selectedChat, onSelectChat }: ChatListProps) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Mock data - Replace with actual API call
  const chats: ChatPreview[] = [
    {
      id: '1',
      user: {
        id: 'user1',
        name: 'Alice Johnson',
        avatar: 'https://bit.ly/alice-avatar',
        isOnline: true,
      },
      lastMessage: {
        content: 'Hey, how are you doing?',
        timestamp: '10:30 AM',
        isRead: false,
      },
      unreadCount: 2,
    },
    {
      id: '2',
      user: {
        id: 'user2',
        name: 'Bob Smith',
        avatar: 'https://bit.ly/bob-avatar',
        isOnline: false,
        lastSeen: '2 hours ago',
      },
      lastMessage: {
        content: 'The project looks great!',
        timestamp: 'Yesterday',
        isRead: true,
      },
      unreadCount: 0,
    },
  ];

  return (
    <VStack h="full" spacing={0}>
      {/* Search Bar */}
      <Box p={4} w="full" borderBottomWidth="1px" borderColor={borderColor}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.500" />
          </InputLeftElement>
          <Input placeholder="Search messages..." />
        </InputGroup>
      </Box>

      {/* Chat List */}
      <VStack spacing={0} align="stretch" overflowY="auto" flex={1}>
        {chats.map((chat) => (
          <Box
            key={chat.id}
            p={4}
            cursor="pointer"
            bg={selectedChat === chat.id ? selectedBg : 'transparent'}
            _hover={{ bg: selectedChat === chat.id ? selectedBg : bgHover }}
            onClick={() => onSelectChat(chat.id)}
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={3} position="relative">
              <Avatar size="md" src={chat.user.avatar} name={chat.user.name}>
                {chat.user.isOnline && (
                  <AvatarBadge
                    boxSize="1.25em"
                    bg="green.500"
                    borderColor="white"
                  />
                )}
              </Avatar>
              <Box flex={1} pr={8}>
                <HStack justify="space-between" mb={1}>
                  <Text fontWeight="bold" fontSize="sm">
                    {chat.user.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {chat.lastMessage.timestamp}
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  noOfLines={1}
                  fontWeight={chat.unreadCount > 0 ? 'bold' : 'normal'}
                >
                  {chat.lastMessage.content}
                </Text>
                {!chat.user.isOnline && chat.user.lastSeen && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Last seen {chat.user.lastSeen}
                  </Text>
                )}
              </Box>
              {chat.unreadCount > 0 && (
                <Box
                  position="absolute"
                  right={0}
                  top="50%"
                  transform="translateY(-50%)"
                  bg="blue.500"
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={1}
                  fontSize="xs"
                >
                  {chat.unreadCount}
                </Box>
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};

export default ChatList;