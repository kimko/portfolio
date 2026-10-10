import { Box, Flex, Wrap, WrapItem } from '@chakra-ui/react';

const tones = {
  light: { tagBg: 'accent.tagBg', tagInk: 'accent.tagInk', text: 'inkSoft' },
  dark: { tagBg: 'night.tagBg', tagInk: 'night.tagInk', text: 'night.inkSoft' },
};

export default function ProjectTags({ materials = [], techniques = [], tone = 'light', size = 'sm' }) {
  const colors = tones[tone];
  const fontSize = size === 'sm' ? 'xs' : 'sm';

  return (
    <Flex direction="column" gap={2}>
      {materials.length > 0 && (
        <Wrap as="ul" spacing={2} listStyleType="none" aria-label="Materials">
          {materials.map((material) => (
            <WrapItem
              as="li"
              key={material}
              bg={colors.tagBg}
              color={colors.tagInk}
              fontSize={fontSize}
              fontWeight="500"
              px={2}
              py="2px"
              borderRadius="2px"
            >
              {material}
            </WrapItem>
          ))}
        </Wrap>
      )}

      {techniques.length > 0 && (
        <Box
          as="ul"
          listStyleType="none"
          aria-label="Techniques"
          fontFamily="mono"
          fontSize={fontSize}
          color={colors.text}
          letterSpacing="0.02em"
          lineHeight="1.6"
        >
          {techniques.map((technique, index) => (
            <Box as="li" key={technique} display="inline">
              {index > 0 && (
                <Box as="span" aria-hidden="true" mx={2} opacity={0.6}>
                  /
                </Box>
              )}
              {technique}
            </Box>
          ))}
        </Box>
      )}
    </Flex>
  );
}
