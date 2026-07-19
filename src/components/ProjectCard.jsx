import { useState } from 'react';
import { Box, Image, Text, VStack, Center } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function ImagePlaceholder() {
  return (
    <Center
      w="100%"
      h="100%"
      bgGradient="linear(135deg, #E8DCC8 0%, #D4C4A8 50%, #C4B090 100%)"
    >
      <Box color="whiteAlpha.700" fontSize="4xl">
        🪵
      </Box>
    </Center>
  );
}

export default function ProjectCard({ project, index, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hero = project.hero;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      bg="bg.card"
      borderRadius="12px"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
      cursor="pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      _hover={{
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        transform: 'translateY(-4px)',
      }}
      sx={{
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Image container with blur-up loading */}
      <Box overflow="hidden" position="relative" h={{ base: '220px', md: '250px' }}>
        {imgError ? (
          <ImagePlaceholder />
        ) : (
          <>
            {/* Blur placeholder - an actual img element using the base64 data URI */}
            {hero.blur && (
              <Image
                src={hero.blur}
                alt=""
                aria-hidden="true"
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                objectFit="cover"
                filter="blur(20px)"
                transform="scale(1.2)"
                opacity={loaded ? 0 : 1}
                transition="opacity 0.5s ease"
                zIndex={1}
                pointerEvents="none"
              />
            )}
            {/* Real thumbnail - fades in when loaded */}
            <Image
              src={hero.thumb}
              alt={hero.alt}
              w="100%"
              h="100%"
              objectFit="cover"
              opacity={loaded ? 1 : 0}
              transition="opacity 0.5s ease"
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
        {/* Gradient overlay for depth */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="40px"
          bgGradient="linear(to-t, blackAlpha.100, transparent)"
          zIndex={2}
        />
      </Box>

      {/* Content */}
      <VStack align="start" spacing={2} p={5}>
        <Text
          fontSize={{ base: 'md', md: 'lg' }}
          fontWeight="600"
          color="text.primary"
          lineHeight="1.3"
        >
          {project.title}
        </Text>
        <Text
          fontSize="sm"
          color="text.secondary"
          noOfLines={2}
          lineHeight="1.6"
        >
          {project.shortDescription}
        </Text>
      </VStack>
    </MotionBox>
  );
}
