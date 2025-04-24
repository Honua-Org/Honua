import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  useColorModeValue,
} from '@chakra-ui/react';
import PageLayout from '../components/layouts/PageLayout';
import ChatList from '../components/ChatList';
import MessageThread from '../components/MessageThread';

import { User, Message } from '../types/messages';


const Messages = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  
  useEffect(() => {
    // Set the selected chat from navigation state if available
    if (location.state?.chatId) {
      setSelectedChat(location.state.chatId);
    }
  }, [location.state]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'user2',
      content: 'Hey there! How\'s the project going?',
      timestamp: '10:30 AM',
      isRead: true
    },
    {
      id: '2',
      senderId: 'user1',
      content: 'Going great! Just finished the main features.',
      timestamp: '10:31 AM',
      isRead: true
    }
  ]);
  const [users] = useState<User[]>([
    {
      id: 'user1',
      name: 'Alice Johnson',
      username: 'alice_j',
      avatar: 'https://bit.ly/alice-avatar',
      isOnline: true,
    },
    {
      id: 'user2',
      name: 'Bob Smith',
      username: 'bob_s',
      avatar: 'https://bit.ly/bob-avatar',
      isOnline: false,
      lastSeen: '2 hours ago',
    },
  ]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <PageLayout>
      {/* Main Messages Area */}
      <Box h="calc(100vh - 8rem)">

          <Grid
            templateColumns={{ base: '1fr', md: '300px 1fr' }}
            h="calc(100vh - 2rem)"
            gap={0}
            bg={bgColor}
            borderRadius="lg"
            overflow="hidden"
            borderWidth="1px"
            borderColor={borderColor}
          >
            {/* Chat List */}
            <GridItem
              borderRightWidth={{ base: 0, md: '1px' }}
              borderColor={borderColor}
            >
              <ChatList
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                users={users}
                messages={messages}
              />
            </GridItem>

            {/* Message Thread */}
            <GridItem>
              <MessageThread 
                selectedChatId={selectedChat}
                messages={messages}
                setMessages={setMessages}
                users={users}
              />
            </GridItem>
          </Grid>
        </Box>
      </PageLayout>
  );
};

export default Messages;