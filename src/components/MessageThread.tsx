import { useState, useRef, useEffect } from 'react';
import {
  VStack,
  Box,
  Text,
  Avatar,
  HStack,
  Input,
  IconButton,
  useColorModeValue,
  Icon,
  Image,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaPaperPlane,
  FaImage,
  FaFile,
  FaSmile,
  FaCheck,
  FaCheckDouble,
} from 'react-icons/fa';

interface MessageThreadProps {
  selectedChatId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  users: User[];
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  media?: {
    type: 'image' | 'video' | 'file';
    url: string;
    preview?: string;
  }[];
}

const MessageThread = ({ selectedChatId }: MessageThreadProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const myMessageBg = useColorModeValue('blue.500', 'blue.500');
  const theirMessageBg = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const timestampColor = useColorModeValue('gray.600', 'gray.300');

  // Mock user ID - Replace with actual auth user ID
  const currentUserId = 'user1';

  // Mock messages - Replace with actual API call
  useEffect(() => {
    if (selectedChatId) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setMessages([
          {
            id: '1',
            senderId: 'user2',
            content: 'Hey there! How is the project going?',
            timestamp: '10:30 AM',
            isRead: true,
          },
          {
            id: '2',
            senderId: 'user1',
            content: 'Going great! Just finished the main features.',
            timestamp: '10:31 AM',
            isRead: true,
          },
          {
            id: '3',
            senderId: 'user2',
            content: 'Can you show me some screenshots?',
            timestamp: '10:32 AM',
            isRead: true,
          },
          {
            id: '4',
            senderId: 'user1',
            content: 'Sure! Here is what I have done so far',
            timestamp: '10:33 AM',
            isRead: false,
            media: [
              {
                type: 'image',
                url: 'https://placehold.co/300x300',
                preview: 'https://placehold.co/300x300',
              },
            ],
          },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedChatId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedFile) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Implement file upload logic
    }
  };

  if (!selectedChatId) {
    return (
      <VStack h="full" justify="center" align="center" spacing={4}>
        <Text color="gray.500">Select a conversation to start messaging</Text>
      </VStack>
    );
  }

  if (isLoading) {
    return (
      <VStack h="full" justify="center" align="center" spacing={4}>
        <Spinner size="xl" />
        <Text>Loading messages...</Text>
      </VStack>
    );
  }

  return (
    <VStack h="full" spacing={0}>
      {/* Messages */}
      <VStack
        flex={1}
        w="full"
        spacing={4}
        p={4}
        overflowY="auto"
        align="stretch"
      >
        {messages.map((message) => {
          const isMyMessage = message.senderId === currentUserId;

          return (
            <Box
              key={message.id}
              alignSelf={isMyMessage ? 'flex-end' : 'flex-start'}
              maxW="70%"
            >
              <HStack
                spacing={2}
                align="flex-start"
                flexDirection={isMyMessage ? 'row-reverse' : 'row'}
              >
                <Avatar
                  size="sm"
                  src={`https://api.dicebear.com/6.x/avatars/svg?seed=${message.senderId}`}
                />
                <Box>
                  <Box
                    bg={isMyMessage ? myMessageBg : theirMessageBg}
                    color={isMyMessage ? 'white' : textColor}
                    px={4}
                    py={2}
                    borderRadius="lg"
                  >
                    <Text>{message.content}</Text>
                    {message.media?.map((media, index) => (
                      <Box key={index} mt={2}>
                        {media.type === 'image' && (
                          <Image
                            src={media.preview || media.url}
                            alt="Shared image"
                            borderRadius="md"
                            maxH="200px"
                            cursor="pointer"
                            fallback={<Box bg="gray.100" borderRadius="md" height="200px" width="300px" display="flex" alignItems="center" justifyContent="center">
                              <Text color="gray.500">Image not available</Text>
                            </Box>}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                  <HStack
                    spacing={1}
                    justify={isMyMessage ? 'flex-end' : 'flex-start'}
                    mt={1}
                  >
                    <Text fontSize="xs" color={timestampColor}>
                      {message.timestamp}
                    </Text>
                    {isMyMessage && (
                      <Icon
                        as={message.isRead ? FaCheckDouble : FaCheck}
                        color={message.isRead ? 'blue.500' : 'gray.500'}
                        boxSize={3}
                      />
                    )}
                  </HStack>
                </Box>
              </HStack>
            </Box>
          );
        })}
        <div ref={messageEndRef} />
      </VStack>

      {/* Message Composer */}
      <Box
        p={4}
        borderTopWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <HStack spacing={2}>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,video/*"
          />
          <Tooltip label="Attach media">
            <IconButton
              aria-label="Attach media"
              icon={<Icon as={FaImage} />}
              variant="ghost"
              onClick={() => document.getElementById('file-upload')?.click()}
            />
          </Tooltip>
          <Tooltip label="Attach file">
            <IconButton
              aria-label="Attach file"
              icon={<Icon as={FaFile} />}
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Add emoji">
            <IconButton
              aria-label="Add emoji"
              icon={<Icon as={FaSmile} />}
              variant="ghost"
            />
          </Tooltip>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <IconButton
            aria-label="Send message"
            icon={<Icon as={FaPaperPlane} />}
            colorScheme="blue"
            onClick={handleSendMessage}
          />
        </HStack>
      </Box>
    </VStack>
  );
};

export default MessageThread;