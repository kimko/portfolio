import { Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionFlex = motion.create(Flex);

export default function Header({ projectCount }) {
  return (
    <MotionFlex
      as="header"
      initial={{ opacity: 0.4, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      align="baseline"
      justify="space-between"
      gap={4}
      borderBottom="1px solid"
      borderColor="line"
      pt={{ base: 4, md: 6 }}
      pb={{ base: 3, md: 4 }}
      mb={{ base: 8, md: 12 }}
    >
      <Heading
        as="h1"
        fontSize={{ base: '4xl', md: '6xl' }}
        fontWeight="600"
        letterSpacing="-0.015em"
        lineHeight="1"
        color="ink"
      >
        Woodworks
      </Heading>
      <Text
        fontFamily="mono"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.12em"
        color="inkSoft"
        whiteSpace="nowrap"
      >
        {projectCount} projects
      </Text>
    </MotionFlex>
  );
}
