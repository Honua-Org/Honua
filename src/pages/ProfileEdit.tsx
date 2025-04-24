import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Avatar } from '@chakra-ui/react';

const ProfileEdit = () => {
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    avatarUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement API call to update profile
    console.log('Profile updated:', profile);
  };

  return (
    <Box maxW="md" mx="auto" mt={5} p={5} borderWidth={1} borderRadius="lg">
      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Username</FormLabel>
          <Input name="username" value={profile.username} onChange={handleChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Full Name</FormLabel>
          <Input name="fullName" value={profile.fullName} onChange={handleChange} />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Avatar URL</FormLabel>
          <Input name="avatarUrl" value={profile.avatarUrl} onChange={handleChange} />
        </FormControl>
        <Avatar src={profile.avatarUrl} size="xl" mb={4} />
        <Button type="submit" colorScheme="blue">Save Changes</Button>
      </form>
    </Box>
  );
};

export default ProfileEdit;