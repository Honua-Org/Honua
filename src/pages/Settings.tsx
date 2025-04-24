import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Switch,
  useColorMode,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Icon,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUser, FaLock, FaBell, FaPalette } from 'react-icons/fa';
import Navigation from '../components/Navigation';

interface UserSettings {
  email: string;
  username: string;
  messagePrivacy: 'everyone' | 'followers' | 'none';
  postVisibility: 'public' | 'followers';
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
}

const Settings = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [settings, setSettings] = useState<UserSettings>({
    email: 'user@example.com',
    username: 'username',
    messagePrivacy: 'everyone',
    postVisibility: 'public',
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    language: 'en',
    theme: colorMode as 'light' | 'dark',
    fontSize: 'medium',
  });

  const handleSettingChange = (field: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    // TODO: Implement API call to save settings
    toast({
      title: 'Settings saved',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    onClose();
    toast({
      title: 'Account deleted',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        <GridItem>
          <VStack spacing={4} align="stretch">
            <Tabs colorScheme="blue" isLazy>
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaUser} />
                    <Text>Account</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaLock} />
                    <Text>Privacy</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaBell} />
                    <Text>Notifications</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaPalette} />
                    <Text>Display</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Account Settings */}
                <TabPanel>
                  <VStack spacing={4} align="stretch" bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                        type="email"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Username</FormLabel>
                      <Input
                        value={settings.username}
                        onChange={(e) => handleSettingChange('username', e.target.value)}
                      />
                    </FormControl>
                    <Button colorScheme="red" onClick={onOpen}>
                      Delete Account
                    </Button>
                  </VStack>
                </TabPanel>

                {/* Privacy Settings */}
                <TabPanel>
                  <VStack spacing={4} align="stretch" bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <FormControl>
                      <FormLabel>Who can message you</FormLabel>
                      <Select
                        value={settings.messagePrivacy}
                        onChange={(e) => handleSettingChange('messagePrivacy', e.target.value)}
                      >
                        <option value="everyone">Everyone</option>
                        <option value="followers">Followers only</option>
                        <option value="none">No one</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Post visibility</FormLabel>
                      <Select
                        value={settings.postVisibility}
                        onChange={(e) => handleSettingChange('postVisibility', e.target.value)}
                      >
                        <option value="public">Public</option>
                        <option value="followers">Followers only</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Notification Settings */}
                <TabPanel>
                  <VStack spacing={4} align="stretch" bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Email notifications</FormLabel>
                      <Switch
                        isChecked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Push notifications</FormLabel>
                      <Switch
                        isChecked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>In-app notifications</FormLabel>
                      <Switch
                        isChecked={settings.inAppNotifications}
                        onChange={(e) => handleSettingChange('inAppNotifications', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Display Settings */}
                <TabPanel>
                  <VStack spacing={4} align="stretch" bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <FormControl>
                      <FormLabel>Language</FormLabel>
                      <Select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Theme</FormLabel>
                      <Select
                        value={settings.theme}
                        onChange={(e) => {
                          handleSettingChange('theme', e.target.value);
                          if (e.target.value !== 'system') {
                            toggleColorMode();
                          }
                        }}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Font Size</FormLabel>
                      <Select
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Button colorScheme="blue" onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </VStack>
        </GridItem>

        {/* Right Sidebar - Intentionally left empty for consistency */}
        <GridItem display={{ base: 'none', md: 'block' }} />
      </Grid>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone. All your data will be permanently removed.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Settings;