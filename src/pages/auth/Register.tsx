import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import { checkUsernameAvailability } from '../../api/profile';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  useToast,
  VStack,
  HStack,
  Icon,
  FormErrorMessage
} from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
}

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  const password = watch('password');
  const username = watch('username');

  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setIsUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const isAvailable = await checkUsernameAvailability(username);
        setIsUsernameAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking username:', error);
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        username: data.username
      });
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google') => {
    try {
      // TODO: Implement OAuth signup logic
      console.log(`${provider} signup clicked`);
    } catch (error) {
      toast({
        title: 'OAuth Signup Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Stack spacing="6" textAlign="center">
          <Heading size={{ base: 'xl', md: '2xl' }}>Create an account</Heading>
          <Text color="gray.600">Start your journey with us today</Text>
        </Stack>

        <Box
          py={{ base: '0', sm: '8' }}
          px={{ base: '4', sm: '10' }}
          bg={{ base: 'transparent', sm: 'white' }}
          boxShadow={{ base: 'none', sm: 'md' }}
          borderRadius={{ base: 'none', sm: 'xl' }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing="6">
              <Stack spacing="5">
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.username}>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <Input
                    id="username"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      },
                      pattern: {
                        value: /^[a-z0-9_]+$/,
                        message: 'Username can only contain lowercase letters, numbers, and underscores'
                      },
                      validate: {
                        available: async (value) => {
                          if (!value || value.length < 3) return true;
                          const isAvailable = await checkUsernameAvailability(value);
                          return isAvailable || 'This username is already taken';
                        }
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
                  {isCheckingUsername && <Text color="gray.500" fontSize="sm">Checking username availability...</Text>}
                  {!isCheckingUsername && !errors.username && username && username.length >= 3 && isUsernameAvailable === true && (
                    <Text color="green.500" fontSize="sm">Username is available</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.fullName}>
                  <FormLabel htmlFor="fullName">Full Name</FormLabel>
                  <Input
                    id="fullName"
                    {...register('fullName', {
                      required: 'Full name is required'
                    })}
                  />
                  <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value =>
                        value === password || 'The passwords do not match'
                    })}
                  />
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>
              </Stack>

              <VStack spacing="4">
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>

                <Divider />

                <Button
                  width="full"
                  variant="outline"
                  leftIcon={<Icon as={FaGoogle} />}
                  onClick={() => handleOAuthSignup('google')}
                >
                  Sign up with Google
                </Button>


              </VStack>
            </Stack>
          </form>

          <HStack spacing="1" justify="center" mt="6">
            <Text color="gray.600">Already have an account?</Text>
            <Link as={RouterLink} to="/login" color="blue.500">
              Sign in
            </Link>
          </HStack>
        </Box>
      </Stack>
    </Container>
  );
};

export default Register;