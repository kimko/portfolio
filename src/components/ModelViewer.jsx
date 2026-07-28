import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFBX, Stage, PresentationControls, Html } from '@react-three/drei';

function FBXModel({ url }) {
  const fbx = useFBX(url);
  return <primitive object={fbx} />;
}

const CanvasLoader = () => (
  <Html center>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: 'sans-serif' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      <div style={{ letterSpacing: '2px', fontSize: '14px', textTransform: 'uppercase' }}>Loading Model</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </Html>
);

export default function ModelViewer({ url }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }} style={{ width: '100%', height: '100%', flex: 1 }}>
      <Suspense fallback={<CanvasLoader />}>
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
