import { useState, useEffect, useEffectEvent, useRef, Suspense, lazy } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  Image,
  Text,
  Box,
  Flex,
  Grid,
  HStack,
  Button,
  IconButton,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoute, useLocation, useRouter } from 'wouter';
import ProjectTags from './ProjectTags';
import LoadingMessage from './LoadingMessage';

const ModelViewer = lazy(() => import('./ModelViewer'));

const MotionBox = motion.create(Box);

const SWIPE_DISTANCE = 60;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const Icon3D = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...iconProps}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...iconProps}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...iconProps}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...iconProps}>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const focusRing = { outline: '3px solid', outlineColor: 'accent.ring', outlineOffset: '2px' };

function ProjectDetails({ project }) {
  return (
    <>
      <ProjectTags
        tone="dark"
        size="md"
        materials={project.materials}
        techniques={project.techniques}
      />

      <Box w="32px" h="2px" bg="accent.rule" my={6} />

      <Text fontSize="md" lineHeight="1.75" maxW="62ch">
        {project.fullDescription}
      </Text>
    </>
  );
}

export default function ProjectModal({ project, isOpen, onClose }) {
  const [location, setLocation] = useLocation();
  const router = useRouter();
  const [match, params] = useRoute('/project/:id/image/:index');
  const toast = useToast();
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const titleRef = useRef(null);
  const swipeStartX = useRef(null);

  const [showDetails, setShowDetails] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setShowDetails(false);
  }

  const [prevProject, setPrevProject] = useState(project);
  useEffect(() => {
    if (project) setPrevProject(project);
  }, [project]);
  const activeProject = project || prevProject;

  const imageCount = activeProject?.images.length ?? 0;
  const routeIndex = match && params.index ? parseInt(params.index, 10) - 1 : 0;
  const selectedIndex = Math.max(0, Math.min(routeIndex, imageCount - 1));
  const currentImage = activeProject?.images[selectedIndex];
  const imageKey = currentImage ? currentImage.url || currentImage.full : null;

  const [loadedKey, setLoadedKey] = useState(null);
  const [zoom, setZoom] = useState({ key: null, level: 1 });
  const imageLoaded = loadedKey === imageKey;
  const zoomLevel = zoom.key === imageKey ? zoom.level : 1;
  const changeZoom = (delta) =>
    setZoom({ key: imageKey, level: Math.min(MAX_ZOOM, Math.max(1, zoomLevel + delta)) });

  const showImage = (index) => {
    if (!project || index < 0 || index >= imageCount || index === selectedIndex) return;
    const path = index === 0 ? `/project/${project.id}` : `/project/${project.id}/image/${index + 1}`;
    setLocation(path, { replace: true });
  };

  const onArrowKey = useEffectEvent((event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') showImage(selectedIndex + 1);
    if (event.key === 'ArrowLeft') showImage(selectedIndex - 1);
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => onArrowKey(event);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeProject && activeProject.images) {
      activeProject.images.forEach((img) => {
        if (!img.is3D && img.full) {
          const image = new window.Image();
          image.src = img.full;
        }
      });
    }
  }, [isOpen, activeProject]);

  const share = async () => {
    const url = new URL(router.hrefs(location), window.location.href).toString();
    const title = `${activeProject.title} · Woodworks`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: currentImage.is3D ? 'It opens on this 3D model.' : 'It opens on this photo.',
        status: 'success',
        duration: 3000,
        position: 'bottom',
      });
    } catch {
      toast({
        title: "Couldn't copy the link",
        description: url,
        status: 'error',
        duration: 8000,
        position: 'bottom',
      });
    }
  };

  const onSwipeStart = (event) => {
    const isPageZoomed = (window.visualViewport?.scale ?? 1) > 1;
    swipeStartX.current = event.touches.length === 1 && !isPageZoomed ? event.touches[0].clientX : null;
  };

  const onSwipeMove = (event) => {
    if (event.touches.length > 1) swipeStartX.current = null;
  };

  const onSwipeEnd = (event) => {
    if (swipeStartX.current === null || zoomLevel > 1) return;
    const distance = event.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (distance < -SWIPE_DISTANCE) showImage(selectedIndex + 1);
    else if (distance > SWIPE_DISTANCE) showImage(selectedIndex - 1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      allowPinchZoom
      initialFocusRef={titleRef}
      closeOnEsc={!showDetails}
      onEsc={() => setShowDetails(false)}
    >
      <ModalOverlay bg="night.bg" />
      <ModalContent bg="night.bg" color="night.ink" borderRadius={0} m={0} h="100dvh" overflow="hidden">
        <ModalCloseButton
          size="lg"
          zIndex={20}
          top={3}
          right={3}
          borderRadius="full"
          bg="rgba(21, 19, 15, 0.7)"
          color="night.ink"
          _hover={{ bg: 'night.hover' }}
        />

        {activeProject && currentImage && (
          <>
            <ModalHeader
              ref={titleRef}
              as="h2"
              tabIndex={-1}
              position="absolute"
              top={3}
              left={3}
              zIndex={20}
              p={0}
              maxW="calc(100% - 88px)"
              _focus={{ outline: 'none' }}
            >
              <Button
                variant="onDark"
                borderRadius="full"
                bg="rgba(21, 19, 15, 0.7)"
                maxW="100%"
                rightIcon={<InfoIcon />}
                onClick={() => setShowDetails((open) => !open)}
                aria-expanded={showDetails}
                aria-controls="project-details"
                fontFamily="heading"
                fontSize="md"
                fontWeight="600"
              >
                <Box as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {activeProject.title}
                </Box>
              </Button>
            </ModalHeader>

            <Grid
              h="100%"
              templateColumns={showDetails && isDesktop ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)'}
              templateRows="minmax(0, 1fr) auto"
              templateAreas={showDetails && isDesktop ? `"media details" "strip details"` : `"media" "strip"`}
            >
              <Box
                gridArea="media"
                position="relative"
                overflow="hidden"
                minH={0}
              >
                {currentImage.is3D ? (
                  <Suspense fallback={<LoadingMessage>Loading 3D viewer</LoadingMessage>}>
                    <ModelViewer key={currentImage.url} url={currentImage.url} alt={currentImage.alt} />
                  </Suspense>
                ) : (
                  <>
                    {currentImage.blur && (
                      <Image
                        src={currentImage.blur}
                        alt=""
                        aria-hidden="true"
                        position="absolute"
                        inset={0}
                        w="100%"
                        h="100%"
                        objectFit="contain"
                        filter="blur(20px)"
                        opacity={imageLoaded ? 0 : 0.5}
                        transition="opacity 0.4s ease"
                        pointerEvents="none"
                      />
                    )}
                    <AnimatePresence mode="wait" initial={false}>
                      <MotionBox
                        key={imageKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: imageLoaded ? 1 : 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        position="absolute"
                        inset={0}
                        p={{ base: 0, md: 4 }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <MotionBox
                          key={zoomLevel > 1 ? 'zoomed' : 'fit'}
                          drag={zoomLevel > 1}
                          dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                          dragElastic={0.1}
                          onTouchStart={onSwipeStart}
                          onTouchMove={onSwipeMove}
                          onTouchEnd={onSwipeEnd}
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
                            draggable={false}
                            onLoad={() => setLoadedKey(imageKey)}
                            pointerEvents="none"
                          />
                        </MotionBox>
                      </MotionBox>
                    </AnimatePresence>
                  </>
                )}

                <AnimatePresence>
                  {showDetails && !isDesktop && (
                    <MotionBox
                      id="project-details"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      position="absolute"
                      left={0}
                      right={0}
                      bottom={0}
                      maxH="60%"
                      overflowY="auto"
                      zIndex={10}
                      bg="night.panel"
                      borderTopRadius="16px"
                      borderTop="1px solid"
                      borderColor="night.line"
                      px={5}
                      pt={5}
                      pb={6}
                    >
                      <ProjectDetails project={activeProject} />
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>

              <Flex
                gridArea="strip"
                align="center"
                gap={3}
                px={{ base: 3, md: 6 }}
                py={3}
                borderTop="1px solid"
                borderColor="night.line"
              >
                <HStack
                  as="ul"
                  listStyleType="none"
                  aria-label="Photos and 3D models"
                  spacing={2}
                  flex="1"
                  minW={0}
                  overflowX="auto"
                  p="4px"
                  sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
                >
                  {activeProject.images.map((img, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <Box as="li" key={img.url || img.full} flexShrink={0}>
                        <Box
                          as="button"
                          type="button"
                          display="block"
                          w="56px"
                          h="56px"
                          borderRadius="4px"
                          overflow="hidden"
                          position="relative"
                          border="2px solid"
                          borderColor={isSelected ? 'night.ink' : 'transparent'}
                          opacity={isSelected ? 1 : 0.55}
                          transition="opacity 0.2s ease, border-color 0.2s ease"
                          _hover={{ opacity: 1 }}
                          _focusVisible={{ ...focusRing, opacity: 1 }}
                          onClick={() => showImage(index)}
                          aria-label={`${img.is3D ? '3D model' : 'Photo'} ${index + 1} of ${imageCount}: ${img.alt}`}
                          aria-current={isSelected ? 'true' : undefined}
                          bg="night.raised"
                          backgroundImage={img.blur ? `url(${img.blur})` : undefined}
                          backgroundSize="cover"
                          backgroundPosition="center"
                        >
                          <Image src={img.thumb} alt="" w="100%" h="100%" objectFit="cover" />
                          <Box
                            position="absolute"
                            bottom="2px"
                            right="2px"
                            bg="rgba(0, 0, 0, 0.6)"
                            p="2px"
                            borderRadius="3px"
                            color="white"
                          >
                            {img.is3D ? <Icon3D /> : <ImageIcon />}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </HStack>

                <HStack spacing={2} flexShrink={0}>
                  {isDesktop && !currentImage.is3D && (
                    <>
                      <IconButton
                        variant="onDark"
                        isRound
                        icon={<ZoomOutIcon />}
                        aria-label="Zoom out"
                        onClick={() => changeZoom(-ZOOM_STEP)}
                        isDisabled={zoomLevel === 1}
                      />
                      <IconButton
                        variant="onDark"
                        isRound
                        icon={<ZoomInIcon />}
                        aria-label="Zoom in"
                        onClick={() => changeZoom(ZOOM_STEP)}
                        isDisabled={zoomLevel >= MAX_ZOOM}
                      />
                    </>
                  )}
                  <Button variant="onDark" borderRadius="full" leftIcon={<ShareIcon />} onClick={share}>
                    Share
                  </Button>
                </HStack>
              </Flex>

              {showDetails && isDesktop && (
                <MotionBox
                  id="project-details"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  gridArea="details"
                  bg="night.panel"
                  borderLeft="1px solid"
                  borderColor="night.line"
                  overflowY="auto"
                  px={8}
                  pt={20}
                  pb={8}
                >
                  <ProjectDetails project={activeProject} />
                </MotionBox>
              )}
            </Grid>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
