import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Avatar,
  Box,
  IconButton,
  useToast,
  Icon,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
import { FaCamera } from 'react-icons/fa';
import { userService, UserProfile } from '../api/user.api';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Partial<UserProfile> & {
    full_name: string;
    username: string;
    bio?: string;
    avatar_url?: string;
  };
  onUpdate: (updatedProfile: UserProfile) => void;
}

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) => {
  const [name, setName] = useState(profile.full_name);
  const [username, setUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateUsername = async (value: string) => {
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError('Username can only contain lowercase letters, numbers, and underscores');
      return false;
    }

    if (value === profile.username) {
      setUsernameError('');
      setIsUsernameAvailable(null);
      return true;
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await userService.checkUsernameAvailability(value);
      setIsUsernameAvailable(isAvailable);
      if (!isAvailable) {
        setUsernameError('This username is already taken');
        return false;
      }
      setUsernameError('');
      return true;
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameError('Error checking username availability');
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && !user) {
      toast({
        title: 'Authentication Error',
        description: 'Please sign in to edit your profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  }, [isOpen, user, toast, onClose]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSubmit = async () => {
    if (!name.trim() || !username.trim() || !validateUsername(username)) {
      toast({
        title: 'Error',
        description: 'Name and username are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update profile information
      await userService.updateProfile(user.id, {
        full_name: name.trim(),
        username: username.trim(),
        bio: bio.trim()
      });

      // Handle avatar upload if a new file was selected
      if (avatarFile) {
        await userService.uploadAvatar(user.id, avatarFile);
      }

      const updatedProfile = {
        id: user.id,
        full_name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatar || profile.avatar_url || '',
        created_at: profile.created_at || new Date().toISOString()
      };

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      // Pass the updated profile data to parent component
      if (onUpdate) {
        onUpdate(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>


            {/* Avatar */}
            <FormControl>
              <Box position="relative" w="fit-content">
                <Avatar size="xl" src={avatar} name={name} />
                <IconButton
                  icon={<Icon as={FaCamera} />}
                  aria-label="Change avatar"
                  size="sm"
                  position="absolute"
                  bottom={0}
                  right={0}
                  onClick={() => document.getElementById('avatarInput')?.click()}
                />
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </Box>
            </FormControl>

            {/* Name */}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </FormControl>

            {/* Username */}
            <FormControl isRequired isInvalid={!!usernameError}>
              <FormLabel>Username</FormLabel>
              <Input
                value={username}
                onChange={async (e) => {
                  const value = e.target.value.toLowerCase();
                  setUsername(value);
                  if (value.length >= 3) {
                    await validateUsername(value);
                  } else {
                    setUsernameError('');
                    setIsUsernameAvailable(null);
                  }
                }}
                placeholder="username"
              />
              {usernameError && (
                <FormErrorMessage>{usernameError}</FormErrorMessage>
              )}
              {isCheckingUsername && (
                <Text color="gray.500" fontSize="sm">Checking username availability...</Text>
              )}
              {!isCheckingUsername && !usernameError && username && username.length >= 3 && isUsernameAvailable === true && (
                <Text color="green.500" fontSize="sm">Username is available</Text>
              )}
            </FormControl>

            {/* Bio */}
            <FormControl>
              <FormLabel>Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;