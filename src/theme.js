import { extendTheme } from '@chakra-ui/react';

const ring = '#A0640F';

const theme = extendTheme({
  colors: {
    paper: '#F7F6F3',
    ink: '#1C1915',
    inkSoft: '#5E564D',
    line: '#E2DDD5',
    accent: {
      ring,
      rule: '#B7791F',
      tagBg: '#F1E4CC',
      tagInk: '#6A4510',
    },
    night: {
      bg: '#15130F',
      panel: '#1D1A16',
      raised: '#2A2520',
      hover: '#37302A',
      line: 'rgba(255, 244, 228, 0.12)',
      ink: '#F3EEE7',
      inkSoft: '#B9AFA4',
      tagBg: '#3A2E1E',
      tagInk: '#F0C987',
    },
  },
  fonts: {
    heading: `'Zilla Slab', 'Rockwell', Georgia, serif`,
    body: `'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`,
    mono: `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace`,
  },
  shadows: {
    outline: `0 0 0 3px ${ring}`,
  },
  styles: {
    global: {
      body: {
        bg: 'paper',
        color: 'ink',
      },
      'h1, h2, h3': {
        textWrap: 'balance',
      },
    },
  },
  components: {
    Button: {
      variants: {
        onDark: {
          bg: 'night.raised',
          color: 'night.ink',
          border: '1px solid',
          borderColor: 'night.line',
          _hover: { bg: 'night.hover', _disabled: { bg: 'night.raised' } },
          _active: { bg: 'night.hover' },
        },
      },
    },
  },
});

export default theme;
