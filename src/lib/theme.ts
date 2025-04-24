import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
        _dark: {
          bg: 'gray.900',
          color: 'white'
        }
      }
    }
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand'
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600'
          }
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          boxShadow: 'sm',
          rounded: 'lg',
          p: 4,
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'md'
          },
          _dark: {
            bg: 'gray.800'
          }
        }
      }
    },
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: '4', md: '8' }
      }
    },
    Heading: {
      baseStyle: {
        color: 'gray.900',
        _dark: {
          color: 'white'
        }
      },
      variants: {
        section: {
          fontSize: 'xl',
          fontWeight: 'semibold',
          mb: 4
        }
      }
    },
    Text: {
      baseStyle: {
        color: 'gray.600',
        _dark: {
          color: 'gray.300'
        }
      },
      variants: {
        secondary: {
          fontSize: 'sm',
          color: 'gray.500'
        }
      }
    },
    Link: {
      baseStyle: {
        color: 'brand.500',
        _hover: {
          textDecoration: 'none',
          color: 'brand.600'
        }
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500'
      }
    }
  }
});