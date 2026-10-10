import { useState } from 'react';
import { Box, Image, Heading, LinkBox, LinkOverlay, Center } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import ProjectTags from './ProjectTags';

const MotionLinkBox = motion.create(LinkBox);

function ImagePlaceholder() {
  return <Center w="100%" h="100%" bgGradient="linear(135deg, #E8DCC8 0%, #D4C4A8 50%, #C4B090 100%)" />;
}

export default function ProjectCard({ project, index, gridColumn }) {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hero = project.hero;

  const prefetchAssets = () => {
    if (hero && hero.thumb) {
      const img = new window.Image();
      img.src = hero.thumb;
    }
  };

  return (
    <MotionLinkBox
      as="li"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      gridColumn={gridColumn}
      onMouseEnter={prefetchAssets}
      onTouchStart={prefetchAssets}
      sx={{
        '.card-media img': { transition: 'transform 0.5s ease, opacity 0.5s ease' },
        '&:hover .card-media img:not([aria-hidden])': { transform: 'scale(1.025)' },
        '&:has(a:focus-visible) .card-media': {
          outline: '3px solid',
          outlineColor: 'accent.ring',
          outlineOffset: '3px',
        },
      }}
    >
      <Box
        className="card-media"
        overflow="hidden"
        position="relative"
        h={{ base: '240px', md: '280px' }}
        borderRadius="4px"
        bg="line"
      >
        {imgError ? (
          <ImagePlaceholder />
        ) : (
          <>
            {hero.blur && (
              <Image
                src={hero.blur}
                alt=""
                aria-hidden="true"
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
                filter="blur(20px)"
                transform="scale(1.2)"
                opacity={loaded ? 0 : 1}
                zIndex={1}
                pointerEvents="none"
              />
            )}
            <Image
              src={hero.thumb}
              alt={hero.alt}
              w="100%"
              h="100%"
              objectFit="cover"
              opacity={loaded ? 1 : 0}
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
      </Box>

      <Box pt={4}>
        <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="600" lineHeight="1.2" color="ink" mb={3}>
          <LinkOverlay as={Link} href={`/project/${project.id}`} _focusVisible={{ outline: 'none' }}>
            {project.title}
          </LinkOverlay>
        </Heading>
        <ProjectTags materials={project.materials} techniques={project.techniques} />
      </Box>
    </MotionLinkBox>
  );
}
