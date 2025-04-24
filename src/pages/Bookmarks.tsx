import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  IconButton,
  Heading,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Container,
} from '@chakra-ui/react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaFolder } from 'react-icons/fa';
import PageLayout from '../components/layouts/PageLayout';
import Post from '../components/Post';

interface Collection {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

interface SavedPost {
  id: string;
  collectionId: string;
  post: {
    id: string;
    author: {
      name: string;
      username: string;
      avatar: string;
    };
    content: string;
    likes: number;
    reposts: number;
    comments: number;
    timestamp: string;
  };
}

const Bookmarks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([
    { id: '1', name: 'Favorites', description: 'My favorite posts', postCount: 5 },
    { id: '2', name: 'Read Later', description: 'Posts to read later', postCount: 3 },
    { id: '3', name: 'Inspiration', description: 'Inspiring content', postCount: 7 },
  ]);

  const [savedPosts] = useState<SavedPost[]>([
    {
      id: '1',
      collectionId: '1',
      post: {
        id: '1',
        author: {
          name: 'Alice Johnson',
          username: 'alice_tech',
          avatar: 'https://bit.ly/alice-avatar',
        },
        content: 'Great article about sustainable technology!',
        likes: 42,
        reposts: 12,
        comments: 8,
        timestamp: '2h ago',
      },
    },
    // Add more mock saved posts as needed
  ]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollection, setNewCollection] = useState({ name: '', description: '' });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleCreateCollection = () => {
    const newId = (collections.length + 1).toString();
    const collection: Collection = {
      id: newId,
      name: newCollection.name,
      description: newCollection.description,
      postCount: 0,
    };
    setCollections([...collections, collection]);
    setNewCollection({ name: '', description: '' });
    onClose();
  };

  const filteredPosts = savedPosts.filter((savedPost) => {
    const matchesCollection = !selectedCollection || savedPost.collectionId === selectedCollection;
    const matchesSearch = searchQuery
      ? savedPost.post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        savedPost.post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCollection && matchesSearch;
  });

  return (
    <PageLayout>
      <Container maxW="container.xl" py={4}>
        <VStack spacing={4} align="stretch">
          <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search saved posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
                <HStack justify="space-between" w="full">
                  <Menu>
                    <MenuButton as={Button} leftIcon={<FaFilter />}>
                      Filter by Collection
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setSelectedCollection(null)}>All Collections</MenuItem>
                      {collections.map((collection) => (
                        <MenuItem
                          key={collection.id}
                          onClick={() => setSelectedCollection(collection.id)}
                        >
                          {collection.name}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                  <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>
                    New Collection
                  </Button>
                </HStack>
              </VStack>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {collections.map((collection) => (
                <Box
                  key={collection.id}
                  p={4}
                  bg={bgColor}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaFolder} color="blue.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Heading size="sm">{collection.name}</Heading>
                        <Text color="gray.500" fontSize="sm">
                          {collection.postCount} posts
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack>
                      <IconButton
                        aria-label="Edit collection"
                        icon={<FaEdit />}
                        size="sm"
                        variant="ghost"
                      />
                      <IconButton
                        aria-label="Delete collection"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                      />
                    </HStack>
                  </HStack>
                  <Text mt={2} fontSize="sm" color="gray.600">
                    {collection.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            <VStack spacing={4} align="stretch">
              {filteredPosts.map((savedPost) => (
                <Post key={savedPost.id} {...savedPost.post} />
              ))}
            </VStack>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Collection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Collection Name</FormLabel>
                <Input
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  placeholder="Enter collection name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={newCollection.description}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, description: e.target.value })
                  }
                  placeholder="Enter collection description"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateCollection}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  );
};

export default Bookmarks;