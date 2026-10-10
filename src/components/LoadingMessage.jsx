import { Spinner, Text, VStack } from '@chakra-ui/react';

export default function LoadingMessage({ children }) {
  return (
    <VStack
      as="output"
      position="absolute"
      inset={0}
      justify="center"
      spacing={4}
      color="night.inkSoft"
      pointerEvents="none"
      zIndex={1}
    >
      <Spinner size="lg" thickness="3px" color="night.ink" emptyColor="night.line" />
      <Text fontFamily="mono" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase">
        {children}
      </Text>
    </VStack>
  );
}
