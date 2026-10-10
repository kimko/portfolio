import { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFBX, Stage, PresentationControls, useProgress } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import { Box, Text, VisuallyHidden } from '@chakra-ui/react';
import LoadingMessage from './LoadingMessage';

const woodTones = ['#B07B52', '#A6704A', '#BB8862'].map(
  (color) => new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0 })
);

function FBXModel({ url }) {
  const fbx = useFBX(url);
  useLayoutEffect(() => {
    let meshIndex = 0;
    fbx.traverse((child) => {
      if (!child.isMesh) return;
      child.material = woodTones[meshIndex % woodTones.length];
      child.castShadow = true;
      child.receiveShadow = true;
      meshIndex += 1;
    });
  }, [fbx]);
  return <primitive object={fbx} />;
}

function Ready({ onReady }) {
  useEffect(() => {
    onReady(true);
  }, [onReady]);
  return null;
}

export default function ModelViewer({ url, alt }) {
  const [ready, setReady] = useState(false);
  const { progress } = useProgress();

  return (
    <Box position="absolute" inset={0}>
      <VisuallyHidden>3D model: {alt}</VisuallyHidden>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <PresentationControls
            speed={1.5}
            global
            zoom={1.5}
            polar={[-0.1, Math.PI / 4]}
            rotation={[0.15, Math.PI / 4, 0]}
          >
            <Stage
              environment={{ files: `${import.meta.env.BASE_URL}potsdamer_platz_1k.hdr` }}
              intensity={0.6}
              adjustCamera={1.5}
            >
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <FBXModel url={url} />
              </group>
            </Stage>
          </PresentationControls>
          <Ready onReady={setReady} />
        </Suspense>
      </Canvas>

      {ready ? (
        <Text
          position="absolute"
          bottom={3}
          left="50%"
          transform="translateX(-50%)"
          fontFamily="mono"
          fontSize="xs"
          letterSpacing="0.08em"
          color="night.inkSoft"
          pointerEvents="none"
          whiteSpace="nowrap"
        >
          Drag to turn the model
        </Text>
      ) : (
        <LoadingMessage>
          Loading 3D model{progress > 0 ? ` · ${Math.round(progress)}%` : ''}
        </LoadingMessage>
      )}
    </Box>
  );
}
