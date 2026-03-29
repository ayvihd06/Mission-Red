import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Stars, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import {
  StarField, Earth, Mars, Rocket, ExhaustParticles,
  LaunchPad, Nebula, CameraController, MarsDust
} from './SceneObjects';

export default function MarsScene({ scrollProgress, shaking }) {
  return (
    <Canvas
      id="three-canvas"
      camera={{ position: [0, 0.5, 8], fov: 75, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      scene={{ background: new THREE.Color('#000408') }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0 }}
      dpr={[1, 2]}
    >
      <AdaptiveDpr pixelated />

      {/* ── Lighting ── */}
      {/* Sun light from side */}
      <directionalLight position={[50, 20, -30]} intensity={2.5} color="#fff6e0" />
      {/* Ambient fill */}
      <ambientLight intensity={0.08} color="#102040" />
      {/* Rim lights */}
      <pointLight position={[-20, 10, -20]} intensity={0.4} color="#4488ff" />
      <pointLight position={[20, -10, 10]} intensity={0.2} color="#ff6633" />

      {/* ── Scene Objects ── */}
      <Stars
        radius={150}
        depth={60}
        count={2000}
        factor={3}
        saturation={0.3}
        fade
        speed={0.4}
      />

      <Suspense fallback={null}>
        <StarField count={4000} />
        <Earth scrollProgress={scrollProgress} />
        <Mars scrollProgress={scrollProgress} />
        <Rocket scrollProgress={scrollProgress} shaking={shaking} />
        <ExhaustParticles scrollProgress={scrollProgress} />
        <LaunchPad scrollProgress={scrollProgress} />
        <Nebula scrollProgress={scrollProgress} />
        <MarsDust scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
