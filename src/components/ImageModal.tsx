import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Flex,
  Image,
  Box,
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const ImageModal = ({ isOpen, onClose, images, currentIndex, onIndexChange }: ImageModalProps) => {
  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalCloseButton color="white" zIndex="modal" />
        <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
          <Flex w="100%" h="100vh" alignItems="center" justifyContent="center" position="relative">
            {images.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous image"
                  icon={<FaChevronLeft />}
                  position="absolute"
                  left={4}
                  onClick={handlePrevious}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
                <IconButton
                  aria-label="Next image"
                  icon={<FaChevronRight />}
                  position="absolute"
                  right={4}
                  onClick={handleNext}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </>
            )}
            <Box maxW="90vw" maxH="90vh" overflow="hidden">
              <Image
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                objectFit="contain"
                w="100%"
                h="100%"
                maxH="90vh"
              />
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;