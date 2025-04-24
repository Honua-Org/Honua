import { Box, VStack, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      p={4}
    >
      <Box
        bg={bgColor}
        p={8}
        rounded="lg"
        shadow="lg"
        maxW="md"
        w="full"
        textAlign="center"
      >
        <VStack spacing={6}>
          <Heading size="xl" color={useColorModeValue('green.500', 'green.300')}>
            Account Verified!
          </Heading>
          <Text fontSize="lg" color={textColor}>
            Your email has been successfully verified. You can now proceed to login.
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            width="full"
            onClick={() => navigate('/login')}
          >
            Continue to Login
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}