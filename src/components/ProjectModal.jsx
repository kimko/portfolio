import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Image,
  Text,
  Box,
  HStack,
  Heading,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionImage = motion.create(Image);

export default function ProjectModal({ project, isOpen, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!project) return null;

  const currentImage = project.images[selectedIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedIndex(0);
        onClose();
      }}
      size={{ base: 'full', md: '3xl' }}
      scrollBehavior="inside"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay
        bg="blackAlpha.700"
        backdropFilter="blur(8px)"
      />
      <ModalContent
        bg="bg.card"
        borderRadius={{ base: '0', md: '16px' }}
        overflow="hidden"
        maxH={{ base: '100vh', md: '90vh' }}
        my={{ base: 0, md: 8 }}
      >
        <ModalCloseButton
          size="lg"
          color="text.secondary"
          zIndex={10}
          top={3}
          right={3}
          bg="whiteAlpha.800"
          borderRadius="full"
          _hover={{ bg: 'whiteAlpha.900', color: 'text.primary' }}
        />
        <ModalBody p={0}>
          {/* Main Image */}
          <Box
            position="relative"
            w="100%"
            h={{ base: '250px', md: '400px' }}
            bg="bg.secondary"
            overflow="hidden"
          >
            <AnimatePresence mode="wait">
              <MotionImage
                key={currentImage.src}
                src={currentImage.src}
                alt={currentImage.alt}
                w="100%"
                h="100%"
                objectFit="cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          </Box>

          {/* Thumbnail Strip */}
          <HStack
            spacing={3}
            px={6}
            py={4}
            overflowX="auto"
            sx={{
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                bg: 'border.medium',
                borderRadius: 'full',
              },
            }}
          >
            {project.images.map((img, index) => (
              <Box
                key={img.src}
                as="button"
                flexShrink={0}
                w="60px"
                h="60px"
                borderRadius="8px"
                overflow="hidden"
                border="2px solid"
                borderColor={
                  index === selectedIndex ? 'accent.500' : 'border.subtle'
                }
                opacity={index === selectedIndex ? 1 : 0.6}
                transition="all 0.2s ease"
                _hover={{ opacity: 1, borderColor: 'accent.400' }}
                onClick={() => setSelectedIndex(index)}
                aria-label={`View image ${index + 1}: ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </Box>
            ))}
          </HStack>

          {/* Content */}
          <Box px={6} pb={8} pt={2}>
            <Heading
              as="h2"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="600"
              color="text.primary"
              mb={1}
            >
              {project.title}
            </Heading>
            <Box
              w="40px"
              h="2px"
              bg="accent.500"
              borderRadius="full"
              mb={4}
            />
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="text.secondary"
              lineHeight="1.8"
            >
              {project.fullDescription}
            </Text>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
