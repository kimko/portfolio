import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export default function Header() {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      textAlign="center"
      mb={{ base: 10, md: 16 }}
      pt={{ base: 6, md: 10 }}
    >
      <Text
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight="600"
        letterSpacing="0.25em"
        textTransform="uppercase"
        color="text.primary"
      >
        Kopowski Woodworks
      </Text>
      <Box
        mx="auto"
        mt={3}
        w="60px"
        h="2px"
        bg="accent.500"
        borderRadius="full"
      />
    </MotionBox>
  );
}
