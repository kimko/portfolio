import { useState, useEffect, useRef, Suspense, lazy } from 'react';
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
  Button,
  Spinner,
  useBreakpointValue
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoute, useLocation } from 'wouter';

const ModelViewer = lazy(() => import('./ModelViewer'));

const MotionBox = motion.create(Box);

const Loading3D = () => (
  <VStack justify="center" align="center" h="100%" w="100%" position="absolute" inset={0} zIndex={1} color="whiteAlpha.700">
    <Spinner size="xl" thickness="3px" color="white" emptyColor="whiteAlpha.200" mb={4} />
    <Text fontSize="sm" letterSpacing="widest" textTransform="uppercase">Loading 3D Engine</Text>
  </VStack>
);

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

const ZoomInIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

export default function ProjectModal({ project, isOpen, onClose }) {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/project/:id/image/:index');
  
  // Derive selectedIndex directly from the URL route
  const routeIndex = match && params.index ? parseInt(params.index, 10) - 1 : 0;
  const selectedIndex = project ? Math.max(0, Math.min(routeIndex, project.images.length - 1)) : 0;

  // Keep a reference to the active project so the exit animation has data to render
  const [prevProject, setPrevProject] = useState(project);
  useEffect(() => {
    if (project) setPrevProject(project);
  }, [project]);
  const activeProject = project || prevProject;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [showInfo, setShowInfo] = useState(false);
  const initialMount = useRef(true);

  // Initialize info state only on initial mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMount.current) {
        setShowInfo(isDesktop ?? false);
        initialMount.current = false;
      }
    } else {
      initialMount.current = true;
    }
  }, [isOpen, isDesktop]);

  // Preload all high-res images for the active project when the modal opens
  useEffect(() => {
    if (isOpen && activeProject && activeProject.images) {
      activeProject.images.forEach((img) => {
        // We only preload static images, not 3D FBX files
        if (!img.is3D && img.full) {
          const image = new window.Image();
          image.src = img.full;
        }
      });
    }
  }, [isOpen, activeProject]);

  // Reset loaded state when switching images
  useEffect(() => {
    setImageLoaded(false);
    setZoomLevel(1);
  }, [selectedIndex]);

  const handleIndexChange = (index) => {
    if (!project) return;
    if (index === 0) {
      setLocation(`/project/${project.id}`, { replace: true });
    } else {
      setLocation(`/project/${project.id}/image/${index + 1}`, { replace: true });
    }
  };

  const currentImage = activeProject?.images[selectedIndex];

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
        
        {activeProject && currentImage && (
          <>
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

        {/* Zoom Controls (Desktop only, Images only) */}
        {isDesktop && !currentImage.is3D && (
          <HStack position="absolute" top={4} left="50%" transform="translateX(-50%)" zIndex={20} spacing={4}>
            <Button
              onClick={() => setZoomLevel(z => Math.max(z - 0.5, 1))}
              bg="rgba(20, 20, 20, 0.6)"
              color="white"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ bg: "whiteAlpha.400" }}
              borderRadius="full"
              w="56px"
              h="56px"
              p={0}
              isDisabled={zoomLevel === 1}
              aria-label="Zoom Out"
            >
              <ZoomOutIcon />
            </Button>
            <Button
              onClick={() => setZoomLevel(z => Math.min(z + 0.5, 3))}
              bg="rgba(20, 20, 20, 0.6)"
              color="white"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ bg: "whiteAlpha.400" }}
              borderRadius="full"
              w="56px"
              h="56px"
              p={0}
              isDisabled={zoomLevel >= 3}
              aria-label="Zoom In"
            >
              <ZoomInIcon />
            </Button>
          </HStack>
        )}

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
                  {activeProject.title}
                </Heading>
                
                <VStack align="start" spacing={3} mb={6}>
                  {activeProject.materials && activeProject.materials.length > 0 && (
                    <Wrap spacing={2}>
                      {activeProject.materials.map((mat) => (
                        <WrapItem key={mat}>
                          <Tag size="md" variant="subtle" colorScheme="orange" borderRadius="sm">
                            {mat}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                  
                  {activeProject.techniques && activeProject.techniques.length > 0 && (
                    <Wrap spacing={2}>
                      {activeProject.techniques.map((tech) => (
                        <WrapItem key={tech}>
                          <Tag size="md" bg="whiteAlpha.200" color="whiteAlpha.800" borderRadius="sm">
                            {tech}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </VStack>

                <Box w="40px" h="2px" bg="accent.500" borderRadius="full" mb={4} />
                
                <Text color="whiteAlpha.800" lineHeight="1.8" fontSize="md">
                  {activeProject.fullDescription}
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
                  <Suspense fallback={<Loading3D />}>
                    <ModelViewer url={currentImage.url} />
                  </Suspense>
                ) : (
                  <MotionBox
                    w="100%"
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MotionBox
                      drag={zoomLevel > 1}
                      dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                      dragElastic={0.1}
                      animate={{ scale: zoomLevel }}
                      transition={{ duration: 0.3 }}
                      style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
                      w="100%"
                      h="100%"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Image
                        src={currentImage.full}
                        alt={currentImage.alt}
                        maxW="100%"
                        maxH="100%"
                        objectFit="contain"
                        onLoad={() => setImageLoaded(true)}
                        pointerEvents="none"
                      />
                    </MotionBox>
                  </MotionBox>
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
              {activeProject.images.map((img, index) => (
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
                  onClick={() => handleIndexChange(index)}
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
        </>
        )}
      </ModalContent>
    </Modal>
  );
}
