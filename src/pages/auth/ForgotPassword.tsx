import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Link,
  Stack,
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: 'Password Reset Sent',
        description: 'Please check your email for instructions to reset your password',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh">
      <Box maxW="md" w="full" p={6} borderWidth={1} borderRadius={8} boxShadow="lg">
        <Heading size="xl" mb={6}>Forgot Password</Heading>
        <Stack spacing={4}>
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Sending reset instructions"
            onClick={handleSubmit}
          >
            Reset Password
          </Button>
          <Link as={RouterLink} to="/login" color="blue.500">
            Back to login
          </Link>
        </Stack>
      </Box>
    </Flex>
  );
};

export default ForgotPassword;