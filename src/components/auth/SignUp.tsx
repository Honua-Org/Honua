import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';

interface SignUpProps {
  referralCode?: string;
}

export const SignUp = ({ referralCode }: SignUpProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            referralCode
          }
        }
      });

      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        
        // Create user profile in the database
        // Create user profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              referral_code: referralCode,
              email
            }
          ]);

        // Initialize user rewards
        const { error: rewardsError } = await supabase
          .from('user_rewards')
          .insert([
            {
              user_id: data.user.id,
              points: 0,
              badges: [],
              referral_code: referralCode,
              tasks_completed: [],
              points_per_like: 5,
              points_per_post: 10,
              points_per_comment: 3
            }
          ]);

        if (profileError) throw profileError;
        if (rewardsError) throw rewardsError;
      }

      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email for verification.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <form onSubmit={handleSignUp}>
        <VStack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold">Sign Up</Text>
          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          {referralCode && (
            <HStack>
              <Text>Referred by:</Text>
              <Text fontWeight="bold">{referralCode}</Text>
            </HStack>
          )}
          <Button type="submit" colorScheme="blue" width="full">
            Sign Up
          </Button>
        </VStack>
      </form>
    </Box>
  );
};