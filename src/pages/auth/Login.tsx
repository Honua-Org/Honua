import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const { signIn } = useAuth();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/feed');
    } catch (error: any) {
      const errorMessage = error.message || 'Please check your email and password';
      const isUnverifiedEmail = errorMessage.includes('verify your email');
      
      toast({
        title: isUnverifiedEmail ? 'Email Not Verified' : 'Login Failed',
        description: errorMessage,
        status: 'error',
        duration: isUnverifiedEmail ? 5000 : 3000,
        isClosable: true,
      });
      
      if (isUnverifiedEmail) {
        toast({
          title: 'Verification Required',
          description: 'Please check your inbox for the verification link.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: 'Google Login Failed',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh">
      <Box maxW="md" w="full" p={6} borderWidth={1} borderRadius={8} boxShadow="lg">
        <Heading size="xl" mb={6}>Login</Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <Input
              {...register('email', { required: 'Email is required' })}
              placeholder="Email"
              type="email"
              isInvalid={!!errors.email}
              errorBorderColor="red.500"
            />
            {errors.email && (
              <Text color="red.500">{errors.email.message}</Text>
            )}
            <Input
              {...register('password', { required: 'Password is required' })}
              placeholder="Password"
              type="password"
              isInvalid={!!errors.password}
              errorBorderColor="red.500"
            />
            {errors.password && (
              <Text color="red.500">{errors.password.message}</Text>
            )}
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Logging in"
            >
              Log in
            </Button>
          </Stack>
        </form>
        <Flex justify="space-between" mt={4}>
          <Link as={RouterLink} to="/forgot-password" color="blue.500">
            Forgot password?
          </Link>
          <Link as={RouterLink} to="/register" color="blue.500">
            Sign up
          </Link>
        </Flex>
        <Flex justify="center" mt={4}>
          <Button
            variant="outline"
            colorScheme="gray"
            leftIcon={<Icon as={FcGoogle} boxSize={5} />}
            onClick={handleGoogleLogin}
            isLoading={isLoading}
            loadingText="Connecting to Google"
            width="full"
          >
            Sign in with Google
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Login;