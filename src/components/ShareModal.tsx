import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  IconButton,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaTwitter, FaFacebook, FaLinkedin, FaLink, FaRocket } from 'react-icons/fa';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
  postId: string;
}

const ShareModal = ({ isOpen, onClose, postUrl }: ShareModalProps) => {
  const toast = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: 'Link Copied',
        description: 'Post link copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleShare = (platform: string) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(postUrl);
    const encodedText = encodeURIComponent('Check out this post on Honua!');

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'warpcast':
        shareUrl = `https://warpcast.com/~/compose?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Share Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={3} spacing={4} mb={4}>
            <VStack>
              <IconButton
                aria-label="Share on X"
                icon={<FaTwitter size="24px" />}
                onClick={() => handleShare('twitter')}
                colorScheme="gray"
                variant="outline"
                size="lg"
                rounded="full"
              />
              <Text fontSize="sm">X</Text>
            </VStack>
            <VStack>
              <IconButton
                aria-label="Share on Facebook"
                icon={<FaFacebook size="24px" />}
                onClick={() => handleShare('facebook')}
                colorScheme="gray"
                variant="outline"
                size="lg"
                rounded="full"
              />
              <Text fontSize="sm">Facebook</Text>
            </VStack>
            <VStack>
              <IconButton
                aria-label="Share on LinkedIn"
                icon={<FaLinkedin size="24px" />}
                onClick={() => handleShare('linkedin')}
                colorScheme="gray"
                variant="outline"
                size="lg"
                rounded="full"
              />
              <Text fontSize="sm">LinkedIn</Text>
            </VStack>
            <VStack>
              <IconButton
                aria-label="Share on Warpcast"
                icon={<FaRocket size="24px" />}
                onClick={() => handleShare('warpcast')}
                colorScheme="gray"
                variant="outline"
                size="lg"
                rounded="full"
              />
              <Text fontSize="sm">Warpcast</Text>
            </VStack>
            <VStack>
              <IconButton
                aria-label="Copy Link"
                icon={<FaLink size="24px" />}
                onClick={handleCopyLink}
                colorScheme="gray"
                variant="outline"
                size="lg"
                rounded="full"
              />
              <Text fontSize="sm">Copy Link</Text>
            </VStack>
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShareModal;