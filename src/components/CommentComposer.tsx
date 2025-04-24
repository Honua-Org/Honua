import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Avatar,
  Text,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import { FaImage, FaLink } from 'react-icons/fa';

interface CommentComposerProps {
  onSubmit: (content: string, attachments?: { type: string; url: string }[]) => void;
  replyingTo?: string;
  placeholder?: string;
  initialContent?: string;
}

const CommentComposer = ({
  onSubmit,
  replyingTo,
  placeholder = 'Write a comment...',
  initialContent = '',
}: CommentComposerProps) => {
  const [content, setContent] = useState(initialContent);
  const [attachments, setAttachments] = useState<{ type: string; url: string }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, attachments);
    setContent('');
    setAttachments([]);
    setIsExpanded(false);
  };

  const handleAttachImage = () => {
    // TODO: Implement image attachment
    console.log('Attach image');
  };

  const handleAttachLink = () => {
    // TODO: Implement link attachment
    console.log('Attach link');
  };

  return (
    <Box w="full" bg="white" borderRadius="lg" p={4}>
      <VStack spacing={4} align="stretch">
        {replyingTo && (
          <Text fontSize="sm" color="gray.500">
            Replying to @{replyingTo}
          </Text>
        )}
        <HStack spacing={3} align="start">
          <Avatar
            size="sm"
            src="https://api.dicebear.com/6.x/avatars/svg?seed=current"
            name="Current User"
          />
          <Box flex={1}>
            {isExpanded ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                minH="100px"
                resize="vertical"
              />
            ) : (
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsExpanded(true)}
              />
            )}
          </Box>
        </HStack>

        {isExpanded && (
          <HStack justify="space-between">
            <HStack spacing={2}>
              <IconButton
                icon={<FaImage />}
                aria-label="Attach image"
                variant="ghost"
                size="sm"
                onClick={handleAttachImage}
              />
              <IconButton
                icon={<FaLink />}
                aria-label="Attach link"
                variant="ghost"
                size="sm"
                onClick={handleAttachLink}
              />
            </HStack>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={handleSubmit}
              isDisabled={!content.trim()}
            >
              Comment
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default CommentComposer;