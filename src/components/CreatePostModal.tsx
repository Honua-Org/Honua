import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  VStack,
  HStack,
  Icon,
  Box,
  Image,
  IconButton,
  useToast,
  Text,
  Input,
  FormControl,
  Avatar
} from '@chakra-ui/react';
import { FaImage, FaVideo, FaLink, FaTimes, FaPoll, FaPlus } from 'react-icons/fa';
import postsApi from '../api/posts';
import { useAuth } from '../contexts/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (newPost: any) => void;
}

interface MediaItem {
  type: 'image' | 'video' | 'link';
  url: string;
  file?: File;
}

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  duration: number;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Draft {
  content: string;
  media: MediaItem[];
  poll?: Poll;
  mentions: User[];
  timestamp: number;
}

const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isPollActive, setIsPollActive] = useState(false);
  const [poll, setPoll] = useState<Poll>({
    question: '',
    options: [{ text: '', votes: 0 }, { text: '', votes: 0 }],
    duration: 24
  });
  const [mentions, setMentions] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('postDraft');
    if (draft) {
      const parsedDraft: Draft = JSON.parse(draft);
      setContent(parsedDraft.content);
      setMedia(parsedDraft.media);
      if (parsedDraft.poll) {
        setPoll(parsedDraft.poll);
        setIsPollActive(true);
      }
      setMentions(parsedDraft.mentions);
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      const draft: Draft = {
        content,
        media,
        poll: isPollActive ? poll : undefined,
        mentions,
        timestamp: Date.now()
      };
      localStorage.setItem('postDraft', JSON.stringify(draft));
    };

    const intervalId = setInterval(saveDraft, 30000); // Auto-save every 30 seconds
    return () => clearInterval(intervalId);
  }, [content, media, poll, isPollActive, mentions]);

  // Mock users for mention suggestions
  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', username: 'johndoe', avatar: 'https://bit.ly/john-avatar' },
    { id: '2', name: 'Jane Smith', username: 'janesmith', avatar: 'https://bit.ly/jane-avatar' },
    { id: '3', name: 'Alice Johnson', username: 'alicej', avatar: 'https://bit.ly/alice-avatar' },
  ];

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMedia: MediaItem[] = Array.from(files).map(file => ({
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      file
    }));

    setMedia([...media, ...newMedia]);
  };

  const handleAddLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      setMedia([...media, { type: 'link', url }]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = [...media];
    const removedItem = newMedia[index];
    // Always revoke blob URL if it exists
    if (removedItem.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedItem.url);
    }
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handlePollOptionAdd = () => {
    setPoll({
      ...poll,
      options: [...poll.options, { text: '', votes: 0 }]
    });
  };

  const handlePollOptionRemove = (index: number) => {
    if (poll.options.length <= 2) return;
    const newOptions = [...poll.options];
    newOptions.splice(index, 1);
    setPoll({ ...poll, options: newOptions });
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...poll.options];
    newOptions[index].text = value;
    setPoll({ ...poll, options: newOptions });
  };

  const handleMentionSearch = (query: string) => {
    const filtered = mockUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestedUsers(filtered);
  };

  const handleMentionSelect = (user: User) => {
    const textArea = textareaRef.current;
    if (!textArea) return;

    const beforeMention = content.slice(0, textArea.selectionStart).replace(/@\w*$/, '');
    const afterMention = content.slice(textArea.selectionStart);
    const newContent = `${beforeMention}@${user.username} ${afterMention}`;
    
    setContent(newContent);
    setMentions([...mentions, user]);
    setIsMentionOpen(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Handle mentions
    const lastWord = newContent.slice(0, e.target.selectionStart).split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      handleMentionSearch(query);
      setIsMentionOpen(true);
    } else {
      setIsMentionOpen(false);
    }
  };

  const handleClose = () => {
    setContent('');
    media.forEach(item => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    setMedia([]);
    localStorage.removeItem('postDraft');
    toast({
      title: 'Draft Saved',
      description: 'Your post draft has been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

    // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any remaining blob URLs
      media.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  const handlePost = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Post content cannot be empty',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Upload media files first
      const mediaUrl: string[] = [];
      for (const mediaItem of media) {
        if (mediaItem.file) {
          const { uploadMedia } = await import('../utils/mediaUpload');
          const uploadedMedia = await uploadMedia(mediaItem.file);
          mediaUrl.push(uploadedMedia.url);
        } else if (mediaItem.type === 'link') {
          mediaUrl.push(mediaItem.url);
        }
      }

      // Check authentication
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to create a post',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create post with media URLs and poll if active
      const pollData = isPollActive && poll.question.trim() && poll.options.some(opt => opt.text.trim())
        ? {
            question: poll.question,
            options: poll.options.filter(opt => opt.text.trim())
          }
        : undefined;
      
      const createdPost = await postsApi.createPost(content, user.id, mediaUrl, pollData);
      toast({
        title: 'Success',
        description: 'Post created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear form
      setContent('');
      setMedia([]);
      setIsPollActive(false);
      setPoll({
        question: '',
        options: [{ text: '', votes: 0 }, { text: '', votes: 0 }],
        duration: 24
      });
      setMentions([]);
      localStorage.removeItem('postDraft');

      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box position="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind?"
              minH="150px"
              mb={4}
              resize="vertical"
            />
            {isMentionOpen && suggestedUsers.length > 0 && (
              <Box
                position="absolute"
                mt={1}
                w="full"
                maxH="200px"
                overflowY="auto"
                bg="white"
                borderWidth="1px"
                borderRadius="md"
                shadow="md"
                zIndex={1000}
              >
                {suggestedUsers.map((user) => (
                  <Box
                    key={user.id}
                    p={2}
                    _hover={{ bg: 'gray.100' }}
                    cursor="pointer"
                    onClick={() => handleMentionSelect(user)}
                  >
                    <HStack spacing={2}>
                      <Avatar size="sm" src={user.avatar} name={user.name} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{user.name}</Text>
                        <Text fontSize="sm" color="gray.500">@{user.username}</Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <HStack spacing={2}>
            {/* Photo Button */}
            <Box
              position="relative"
              _hover={{
                '& > .tooltip': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <IconButton
                aria-label="Add photo"
                icon={<Icon as={FaImage} />}
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              />
              <Text
                className="tooltip"
                position="absolute"
                bottom="-20px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                opacity={0}
                visibility="hidden"
                transition="all 0.2s"
                whiteSpace="nowrap"
              >
                Photo
              </Text>
            </Box>

            {/* Video Button */}
            <Box
              position="relative"
              _hover={{
                '& > .tooltip': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <IconButton
                aria-label="Add video"
                icon={<Icon as={FaVideo} />}
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              />
              <Text
                className="tooltip"
                position="absolute"
                bottom="-20px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                opacity={0}
                visibility="hidden"
                transition="all 0.2s"
                whiteSpace="nowrap"
              >
                Video
              </Text>
            </Box>

            {/* Link Button */}
            <Box
              position="relative"
              _hover={{
                '& > .tooltip': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <IconButton
                aria-label="Add link"
                icon={<Icon as={FaLink} />}
                variant="ghost"
                size="sm"
                onClick={handleAddLink}
              />
              <Text
                className="tooltip"
                position="absolute"
                bottom="-20px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                opacity={0}
                visibility="hidden"
                transition="all 0.2s"
                whiteSpace="nowrap"
              >
                Link
              </Text>
            </Box>

            {/* Poll Button */}
            <Box
              position="relative"
              _hover={{
                '& > .tooltip': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <IconButton
                aria-label="Add poll"
                icon={<Icon as={FaPoll} />}
                variant="ghost"
                size="sm"
                onClick={() => setIsPollActive(true)}
              />
              <Text
                className="tooltip"
                position="absolute"
                bottom="-20px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                opacity={0}
                visibility="hidden"
                transition="all 0.2s"
                whiteSpace="nowrap"
              >
                Poll
              </Text>
            </Box>
          </HStack>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="image/*,video/*"
            style={{ display: 'none' }}
            multiple
          />

          {/* Media Preview */}
          {media.length > 0 && (
            <VStack mt={4} align="stretch">
              {media.map((item, index) => (
                <Box key={index} position="relative">
                  {item.type === 'image' && (
                    <Image src={item.url} alt="Preview" maxH="200px" objectFit="cover" borderRadius="md" />
                  )}
                  {item.type === 'link' && (
                    <Box p={2} borderWidth={1} borderRadius="md">
                      <Text>{item.url}</Text>
                    </Box>
                  )}
                  <IconButton
                    icon={<FaTimes />}
                    size="xs"
                    position="absolute"
                    top={2}
                    right={2}
                    onClick={() => handleRemoveMedia(index)}
                    aria-label="Remove media"
                  />
                </Box>
              ))}
            </VStack>
          )}

          {/* Poll Options */}
          {isPollActive && (
            <VStack spacing={3} align="stretch" mt={4}>
              <FormControl>
                <Input
                  placeholder="Poll question"
                  value={poll.question}
                  onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                />
              </FormControl>
              {poll.options.map((option, index) => (
                <HStack key={index}>
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  />
                  {index > 1 && (
                    <IconButton
                      icon={<FaTimes />}
                      aria-label="Remove option"
                      size="sm"
                      onClick={() => handlePollOptionRemove(index)}
                    />
                  )}
                </HStack>
              ))}
              {poll.options.length < 4 && (
                <Button
                  leftIcon={<FaPlus />}
                  variant="outline"
                  size="sm"
                  onClick={handlePollOptionAdd}
                >
                  Add Option
                </Button>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} size="sm" onClick={handleClose}>
            Save Draft
          </Button>
          <Button colorScheme="blue" size="sm" onClick={handlePost}>
            Post
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreatePostModal;