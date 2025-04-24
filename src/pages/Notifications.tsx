import { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaAt, FaHeart, FaRetweet, FaComment, FaUserPlus } from 'react-icons/fa';
import PageLayout from '../components/layouts/PageLayout';
import { Button } from '@chakra-ui/react';

interface Notification {
  id: string;
  type: 'mention' | 'like' | 'repost' | 'comment' | 'follow';
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  postId?: string;
  read: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'mention',
      user: {
        name: 'Alice Johnson',
        username: 'alice_tech',
        avatar: 'https://bit.ly/alice-avatar',
      },
      content: 'mentioned you in a post',
      timestamp: '2h ago',
      postId: '123',
      read: false,
    },
    {
      id: '2',
      type: 'like',
      user: {
        name: 'Bob Smith',
        username: 'bob_creates',
        avatar: 'https://bit.ly/bob-avatar',
      },
      content: 'liked your post',
      timestamp: '4h ago',
      postId: '456',
      read: true,
    },
    {
      id: '3',
      type: 'follow',
      user: {
        name: 'Carol White',
        username: 'carol_white',
        avatar: 'https://bit.ly/carol-avatar',
      },
      content: 'started following you',
      timestamp: '1d ago',
      read: true,
    },
  ]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return FaAt;
      case 'like':
        return FaHeart;
      case 'repost':
        return FaRetweet;
      case 'comment':
        return FaComment;
      case 'follow':
        return FaUserPlus;
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
  };

  return (
    <PageLayout>
      <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <VStack spacing={4} align="stretch">
          {notifications.map((notification) => (
            <HStack key={notification.id} spacing={4} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} _hover={{ bg: hoverBg }}>
              <Avatar name={notification.user.name} src={notification.user.avatar} size="md" />
              <VStack align="start" spacing={1} flex="1">
                <HStack>
                  <Text fontWeight="bold">{notification.user.name}</Text>
                  <Icon as={getNotificationIcon(notification.type)} color="gray.500" />
                </HStack>
                <Text>{notification.content}</Text>
                <Text fontSize="sm" color="gray.500">{notification.timestamp}</Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Box>
      <Button colorScheme="blue" onClick={markAllAsRead}>Mark All as Read</Button>
    </PageLayout>
  );
};

export default Notifications;