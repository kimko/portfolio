import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    bg: { primary: '#FAFAFA', secondary: '#F0F0F0', card: '#FFFFFF' },
    text: { primary: '#1A1A1A', secondary: '#6B6B6B', muted: '#9E9E9E' },
    accent: {
      50: '#FFF8E1',
      100: '#FFECB3',
      200: '#FFD54F',
      300: '#FFCA28',
      400: '#FFC107',
      500: '#D4A017',
      600: '#B8860B',
      700: '#8B6914',
      800: '#6B4F10',
      900: '#4A3508',
    },
    border: { subtle: '#E8E8E8', medium: '#D0D0D0' },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'bg.primary',
        color: 'text.primary',
      },
    },
  },
  components: {
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'blackAlpha.700',
          backdropFilter: 'blur(8px)',
        },
        dialog: {
          bg: 'bg.card',
        },
      },
    },
  },
});

export default theme;
