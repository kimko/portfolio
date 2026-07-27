import { useState, useEffect } from 'react';
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
  VStack,
  Wrap,
  WrapItem,
  Tag,
  Button
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { useFBX, Stage, PresentationControls } from '@react-three/drei';
import { Suspense } from 'react';

const MotionBox = motion.create(Box);

function FBXModel({ url }) {
  const fbx = useFBX(url);
  return <primitive object={fbx} />;
}

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const Icon3D = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

export default function ProjectModal({ project, isOpen, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Reset state when project changes or modal opens
  useEffect(() => {
    setSelectedIndex(0);
    setImageLoaded(false);
    setShowInfo(false);
  }, [project, isOpen]);

  // Reset loaded state when switching images
  useEffect(() => {
    setImageLoaded(false);
  }, [selectedIndex]);

  if (!project) return null;

  const currentImage = project.images[selectedIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      allowPinchZoom={true}
    >
      <ModalOverlay bg="black" />
      <ModalContent bg="black" borderRadius="0" m={0}>
        <ModalCloseButton
          size="lg"
          color="white"
          zIndex={20}
          top={4}
          right={4}
          bg="whiteAlpha.200"
          borderRadius="full"
          _hover={{ bg: 'whiteAlpha.400' }}
        />
        
        {/* Info Toggle Button */}
        <MotionBox 
          position="absolute" 
          top={4} 
          left={4} 
          zIndex={20}
          animate={!showInfo ? { 
            boxShadow: ["0px 0px 0px 0px rgba(255,255,255,0.4)", "0px 0px 0px 10px rgba(255,255,255,0)", "0px 0px 0px 0px rgba(255,255,255,0)"] 
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          borderRadius="full"
        >
          <Button
            leftIcon={<InfoIcon />}
            onClick={() => setShowInfo(!showInfo)}
            borderRadius="full"
            bg={showInfo ? "white" : "rgba(20, 20, 20, 0.6)"}
            color={showInfo ? "black" : "white"}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={showInfo ? "white" : "whiteAlpha.300"}
            _hover={{ bg: showInfo ? "white" : "whiteAlpha.400" }}
            size="md"
            px={5}
          >
            {showInfo ? "Hide Details" : "Project Info"}
          </Button>
        </MotionBox>

        <ModalBody p={0} display="flex" flexDirection="column" h="100vh" overflow="hidden" position="relative">
          
          {/* Info Panel Overlay */}
          <AnimatePresence>
            {showInfo && (
              <MotionBox
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                position="absolute"
                top={{ base: "80px", md: 20 }}
                left={4}
                w={{ base: "calc(100% - 32px)", md: "400px" }}
                maxH="calc(100vh - 120px)"
                bg="rgba(20, 20, 20, 0.85)"
                backdropFilter="blur(16px)"
                borderRadius="16px"
                p={6}
                zIndex={15}
                border="1px solid"
                borderColor="whiteAlpha.200"
                overflowY="auto"
                sx={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.300', borderRadius: 'full' },
                }}
              >
                <Heading as="h2" fontSize="2xl" color="white" mb={2}>
                  {project.title}
                </Heading>
                
                <VStack align="start" spacing={3} mb={6}>
                  {project.materials && project.materials.length > 0 && (
                    <Wrap spacing={2}>
                      {project.materials.map((mat) => (
                        <WrapItem key={mat}>
                          <Tag size="md" variant="subtle" colorScheme="orange" borderRadius="full">
                            {mat}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                  
                  {project.techniques && project.techniques.length > 0 && (
                    <Wrap spacing={2}>
                      {project.techniques.map((tech) => (
                        <WrapItem key={tech}>
                          <Tag size="md" variant="outline" colorScheme="whiteAlpha" color="whiteAlpha.800" borderRadius="full">
                            {tech}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </VStack>

                <Box w="40px" h="2px" bg="accent.500" borderRadius="full" mb={4} />
                
                <Text color="whiteAlpha.800" lineHeight="1.8" fontSize="md">
                  {project.fullDescription}
                </Text>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Main Image Area */}
          <Box
            flex="1"
            position="relative"
            w="100%"
            bg="black"
          >
            {/* Blur placeholder */}
            {currentImage.blur && (
              <Image
                src={currentImage.blur}
                alt=""
                aria-hidden="true"
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%) scale(1.1)"
                w="100%"
                h="100%"
                objectFit="contain"
                filter="blur(20px)"
                opacity={imageLoaded ? 0 : 0.5}
                transition="opacity 0.4s ease"
                zIndex={1}
                pointerEvents="none"
              />
            )}

            {/* Full-size image or 3D Model */}
            <AnimatePresence mode="wait">
              <MotionBox
                key={currentImage.url || currentImage.full}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded || currentImage.is3D ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                display="flex"
                alignItems={currentImage.is3D ? "stretch" : "center"}
                justifyContent="center"
                zIndex={2}
                p={{ base: 0, md: 8 }}
                pb={{ base: "90px", md: "100px" }} // Leave space for thumbnails
              >
                {currentImage.is3D ? (
                  <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }} style={{ width: '100%', height: '100%', flex: 1 }}>
                    <Suspense fallback={null}>
                      <PresentationControls 
                        speed={1.5} 
                        global 
                        zoom={1.5} 
                        polar={[-0.1, Math.PI / 4]}
                        rotation={[0.15, Math.PI / 4, 0]}
                      >
                        <Stage environment="city" intensity={0.6}>
                          <group rotation={[-Math.PI / 2, 0, 0]}>
                            <FBXModel url={currentImage.url} />
                          </group>
                        </Stage>
                      </PresentationControls>
                    </Suspense>
                  </Canvas>
                ) : (
                  <Image
                    src={currentImage.full}
                    alt={currentImage.alt}
                    maxW="100%"
                    maxH="100%"
                    objectFit="contain"
                    onLoad={() => setImageLoaded(true)}
                  />
                )}
              </MotionBox>
            </AnimatePresence>
          </Box>

          {/* Thumbnail Strip (Bottom overlay) */}
          <Box 
            position="absolute" 
            bottom={{ base: 4, md: 8 }} 
            left="0" 
            right="0" 
            zIndex={10}
            display="flex"
            justifyContent="center"
          >
            <HStack
              spacing={3}
              px={4}
              py={3}
              bg="rgba(20, 20, 20, 0.6)"
              backdropFilter="blur(10px)"
              borderRadius="16px"
              border="1px solid"
              borderColor="whiteAlpha.200"
              maxW="90vw"
              overflowX="auto"
              sx={{
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {project.images.map((img, index) => (
                <Box
                  key={img.url || img.full}
                  as="button"
                  flexShrink={0}
                  w="60px"
                  h="60px"
                  borderRadius="8px"
                  overflow="hidden"
                  position="relative"
                  border="2px solid"
                  borderColor={
                    index === selectedIndex ? 'white' : 'transparent'
                  }
                  opacity={index === selectedIndex ? 1 : 0.5}
                  transition="all 0.2s ease"
                  _hover={{ opacity: 1, borderColor: index === selectedIndex ? 'white' : 'whiteAlpha.500' }}
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`View image ${index + 1}: ${img.alt}`}
                  bg="black"
                  backgroundImage={img.blur ? `url(${img.blur})` : undefined}
                  backgroundSize="cover"
                  backgroundPosition="center"
                >
                  <Image
                    src={img.thumb}
                    alt={img.alt}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                  
                  {/* Indicator Overlay */}
                  <Box 
                    position="absolute" 
                    bottom="2px" 
                    right="2px" 
                    bg="rgba(0,0,0,0.6)" 
                    p="2px" 
                    borderRadius="4px"
                    backdropFilter="blur(4px)"
                    color="white"
                  >
                    {img.is3D ? <Icon3D /> : <ImageIcon />}
                  </Box>
                </Box>
              ))}
            </HStack>
          </Box>

        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
