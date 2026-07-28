import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFBX, Stage, PresentationControls } from '@react-three/drei';

function FBXModel({ url }) {
  const fbx = useFBX(url);
  return <primitive object={fbx} />;
}

export default function ModelViewer({ url }) {
  return (
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
              <FBXModel url={url} />
            </group>
          </Stage>
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}
