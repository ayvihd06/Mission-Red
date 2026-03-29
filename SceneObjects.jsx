import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, AdaptiveDpr, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_WAYPOINTS, lerpCameraWaypoint, getScrollSection } from '../utils/cameraRig';

// ─── Star Field ────────────────────────────────────────────────────────────────
export function StarField({ count = 3000 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) s[i] = 0.3 + Math.random() * 1.2;
    return s;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.005;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.003) * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        sizeAttenuation
        transparent
        opacity={0.85}
        color="#c8e0ff"
        vertexColors={false}
      />
    </points>
  );
}

// ─── Earth ─────────────────────────────────────────────────────────────────────
export function Earth({ scrollProgress }) {
  const ref = useRef();
  const atmosphereRef = useRef();

  // Earth starts large (nearby), fades/shrinks as we travel
  const scale = useMemo(() => Math.max(0.05, 1 - scrollProgress * 1.5), [scrollProgress]);
  const opacity = useMemo(() => Math.max(0, 1 - scrollProgress * 2.5), [scrollProgress]);
  const position = useMemo(() => [
    -2 - scrollProgress * 20,
    -1 - scrollProgress * 8,
    -5 - scrollProgress * 30,
  ], [scrollProgress]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = -clock.elapsedTime * 0.03;
    }
  });

  return (
    <group position={position}>
      {/* Earth core */}
      <mesh ref={ref} scale={[scale, scale, scale]}>
        <sphereGeometry args={[3, 64, 64]} />
        <meshPhongMaterial
          color="#1a6baa"
          emissive="#0a2a4a"
          emissiveIntensity={0.3}
          transparent
          opacity={opacity}
          shininess={60}
        />
      </mesh>
      {/* Continents overlay */}
      <mesh scale={[scale * 1.002, scale * 1.002, scale * 1.002]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshPhongMaterial
          color="#2d8a4e"
          transparent
          opacity={opacity * 0.6}
          wireframe={false}
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={[scale * 1.05, scale * 1.05, scale * 1.05]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshPhongMaterial
          color="#4488ff"
          transparent
          opacity={opacity * 0.15}
          side={THREE.BackSide}
          emissive="#2244ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh scale={[scale * 1.01, scale * 1.01, scale * 1.01]}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.25}
          wireframe
        />
      </mesh>
    </group>
  );
}

// ─── Mars ──────────────────────────────────────────────────────────────────────
export function Mars({ scrollProgress }) {
  const { scene } = useGLTF('/models/mars.glb');
  const ref = useRef();
  const atmosphereRef = useRef();

  // Mars starts tiny (far), grows as we approach
  const marsProgress = Math.max(0, (scrollProgress - 0.4) / 0.6);
  const scale = (0.05 + marsProgress * 4.5) * 1.2;
  const position = [
    1.5 * (1 - marsProgress),
    0.3 * (1 - marsProgress),
    -80 + marsProgress * 75,
  ];

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.04;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y = -clock.elapsedTime * 0.02;
  });

  return (
    <group position={position}>
      {/* Light glow as we approach Mars */}
      {marsProgress > 0.5 && (
        <pointLight position={[0, 0, 5]} color="#ff4400" intensity={marsProgress * 8} distance={20} />
      )}
      
      {/* Mars 3D Model */}
      <primitive 
        ref={ref}
        object={scene.clone()} 
        scale={[scale, scale, scale]} 
      />
      
      {/* Thin atmosphere glow layer */}
      <mesh ref={atmosphereRef} scale={[scale * 1.03, scale * 1.03, scale * 1.03]}>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshPhongMaterial
          color="#e05020"
          emissive="#c03010"
          emissiveIntensity={0.2}
          transparent
          opacity={0.05 + marsProgress * 0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Preload models for better performance
useGLTF.preload('/models/mars.glb');

// ─── Rocket ────────────────────────────────────────────────────────────────────
export function Rocket({ scrollProgress, shaking }) {
  const rocketRef = useRef();
  const flameRef = useRef();
  const exhaustRef = useRef();

  const launchProgress = Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.25));
  const isLaunching = scrollProgress > 0.05 && scrollProgress < 0.5;

  useFrame(({ clock }) => {
    if (!rocketRef.current) return;
    const t = clock.elapsedTime;

    // Bobbing when idle
    if (scrollProgress < 0.05) {
      rocketRef.current.position.y = Math.sin(t * 1.2) * 0.15;
    }

    // Ascent along Y after launch
    const rocketY = launchProgress * 40 - 2;
    rocketRef.current.position.y = rocketY;
    rocketRef.current.position.x = Math.sin(launchProgress * Math.PI * 0.5) * launchProgress * 2;
    rocketRef.current.rotation.z = -launchProgress * 0.1;

    // Shake during launch
    if (shaking) {
      rocketRef.current.position.x += (Math.random() - 0.5) * 0.05;
      rocketRef.current.position.y += (Math.random() - 0.5) * 0.05;
    }

    // Flame flicker
    if (flameRef.current) {
      const flicker = 0.8 + Math.sin(t * 20) * 0.2 + Math.random() * 0.1;
      flameRef.current.scale.set(flicker, 1 + launchProgress + Math.sin(t * 15) * 0.3, flicker);
      flameRef.current.material.emissiveIntensity = 1 + Math.sin(t * 30) * 0.5;
    }
    if (exhaustRef.current) {
      exhaustRef.current.scale.set(
        1 + launchProgress * 0.5,
        1 + launchProgress * 2 + Math.sin(t * 20) * 0.4,
        1 + launchProgress * 0.5
      );
    }
  });

  const flameVisible = scrollProgress > 0.04;
  const rocketVisible = scrollProgress < 0.75;

  return (
    <group ref={rocketRef} position={[0, -2, 0]} visible={rocketVisible}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 3, 16]} />
        <meshPhongMaterial color="#d0d8e8" emissive="#101820" emissiveIntensity={0.3} shininess={100} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.25, 1, 16]} />
        <meshPhongMaterial color="#c0c8d8" emissive="#101820" emissiveIntensity={0.2} shininess={120} />
      </mesh>
      {/* Nose tip accent */}
      <mesh position={[0, 2.35, 0]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshPhongMaterial color="#ff4422" emissive="#ff2200" emissiveIntensity={0.8} />
      </mesh>
      {/* Fin × 4 */}
      {[0, 90, 180, 270].map((ang, i) => (
        <group key={i} rotation={[0, (ang * Math.PI) / 180, 0]}>
          <mesh position={[0.4, -1.1, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.5, 0.9, 0.04]} />
            <meshPhongMaterial color="#b0b8c8" emissive="#080d18" emissiveIntensity={0.2} shininess={80} />
          </mesh>
        </group>
      ))}
      {/* Engine bell */}
      <mesh position={[0, -1.7, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 0.4, 16]} />
        <meshPhongMaterial color="#808898" emissive="#101820" emissiveIntensity={0.3} shininess={60} />
      </mesh>
      {/* Mission Red stripe */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.252, 0.252, 0.3, 16]} />
        <meshPhongMaterial color="#c1440e" emissive="#8b2800" emissiveIntensity={0.6} />
      </mesh>
      {/* Window */}
      <mesh position={[0, 0.8, 0.26]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshPhongMaterial color="#88ccff" emissive="#224488" emissiveIntensity={0.8} shininess={200} />
      </mesh>

      {/* ── Exhaust flame ── */}
      {flameVisible && (
        <>
          <mesh ref={flameRef} position={[0, -2.1, 0]}>
            <coneGeometry args={[0.25, 1.5, 12]} />
            <meshPhongMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Outer flame glow */}
          <mesh ref={exhaustRef} position={[0, -2.4, 0]}>
            <coneGeometry args={[0.4, 2, 8]} />
            <meshPhongMaterial
              color="#ffaa00"
              emissive="#ff8800"
              emissiveIntensity={1.5}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* Point light for flame glow */}
          <pointLight position={[0, -2.5, 0]} color="#ff6600" intensity={isLaunching ? 8 : 3} distance={8} />
        </>
      )}
    </group>
  );
}

// ─── Exhaust Particle Trail ────────────────────────────────────────────────────
export function ExhaustParticles({ scrollProgress }) {
  const ref = useRef();
  const count = 200;

  const positions = useMemo(() => new Float32Array(count * 3), []);
  const velocities = useMemo(() => {
    const v = [];
    for (let i = 0; i < count; i++) {
      v.push({
        x: (Math.random() - 0.5) * 0.05,
        y: -0.1 - Math.random() * 0.15,
        z: (Math.random() - 0.5) * 0.05,
        life: Math.random(),
        maxLife: 0.5 + Math.random() * 0.5,
      });
    }
    return v;
  }, []);

  const isActive = scrollProgress > 0.05 && scrollProgress < 0.5;
  const rocketY = Math.max(0, (scrollProgress - 0.05) / 0.25) * 40 - 2;

  useFrame(() => {
    if (!ref.current || !isActive) return;
    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      v.life += 0.016;
      if (v.life > v.maxLife) {
        v.life = 0;
        positions[i * 3] = (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = rocketY - 1.8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      positions[i * 3] += v.x;
      positions[i * 3 + 1] += v.y;
      positions[i * 3 + 2] += v.z;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} visible={isActive}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#ff8844" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── Launch Pad ────────────────────────────────────────────────────────────────
export function LaunchPad({ scrollProgress }) {
  const visible = scrollProgress < 0.08;
  return (
    <group position={[0, -5, 0]} visible={visible}>
      {/* Base platform */}
      <mesh>
        <cylinderGeometry args={[3, 3.5, 0.3, 32]} />
        <meshPhongMaterial color="#404858" emissive="#101520" emissiveIntensity={0.2} />
      </mesh>
      {/* Center pedestal */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.5, 16]} />
        <meshPhongMaterial color="#303840" emissive="#0a1018" emissiveIntensity={0.2} />
      </mesh>
      {/* Support arms */}
      {[0, 60, 120, 180, 240, 300].map((ang, i) => (
        <mesh key={i} position={[Math.cos((ang * Math.PI) / 180) * 1.5, 0.3, Math.sin((ang * Math.PI) / 180) * 1.5]} rotation={[0, (-ang * Math.PI) / 180, 0]}>
          <boxGeometry args={[0.1, 0.6, 1.8]} />
          <meshPhongMaterial color="#505868" emissive="#101520" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Ground glow */}
      <pointLight position={[0, 1, 0]} color="#ff6600" intensity={scrollProgress > 0.04 ? 5 : 0} distance={6} />
    </group>
  );
}

// ─── Nebula Background ────────────────────────────────────────────────────────
export function Nebula({ scrollProgress }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.elapsedTime * 0.002;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.001) * 0.05;
    }
  });

  return (
    <mesh ref={ref} position={[20, 5, -100]}>
      <sphereGeometry args={[35, 16, 16]} />
      <meshPhongMaterial
        color="#c1440e"
        emissive="#601000"
        emissiveIntensity={0.3 + scrollProgress * 0.4}
        transparent
        opacity={0.04 + scrollProgress * 0.06}
        wireframe={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ─── Camera Controller ────────────────────────────────────────────────────────
export function CameraController({ scrollProgress, shaking }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.5, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const numWP = CAMERA_WAYPOINTS.length;
    const segSize = 1 / (numWP - 1);
    const rawSeg = scrollProgress / segSize;
    const seg = Math.min(Math.floor(rawSeg), numWP - 2);
    const t = rawSeg - seg;

    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const a = CAMERA_WAYPOINTS[seg];
    const b = CAMERA_WAYPOINTS[seg + 1];

    targetPos.current.set(
      a.position[0] + (b.position[0] - a.position[0]) * ease,
      a.position[1] + (b.position[1] - a.position[1]) * ease,
      a.position[2] + (b.position[2] - a.position[2]) * ease
    );
    targetLook.current.set(
      a.lookAt[0] + (b.lookAt[0] - a.lookAt[0]) * ease,
      a.lookAt[1] + (b.lookAt[1] - a.lookAt[1]) * ease,
      a.lookAt[2] + (b.lookAt[2] - a.lookAt[2]) * ease
    );

    const lerpSpeed = 0.04;
    camera.position.lerp(targetPos.current, lerpSpeed);
    currentLook.current.lerp(targetLook.current, lerpSpeed);
    camera.lookAt(currentLook.current);

    // Shake offset
    if (shaking) {
      camera.position.x += (Math.random() - 0.5) * 0.08;
      camera.position.y += (Math.random() - 0.5) * 0.06;
    }

    // FOV interpolation
    const targetFov = a.fov + (b.fov - a.fov) * ease;
    camera.fov += (targetFov - camera.fov) * 0.03;
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── Mars Surface Dust ────────────────────────────────────────────────────────
export function MarsDust({ scrollProgress }) {
  const ref = useRef();
  const count = 500;
  const marsProgress = Math.max(0, (scrollProgress - 0.7) / 0.3);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = -2 + Math.random() * 2;
      pos[i * 3 + 2] = -60 + (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current || marsProgress < 0.1) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      positions[i * 3] += Math.sin(t * 0.5 + i) * 0.003;
      positions[i * 3 + 1] += Math.sin(t * 1.2 + i * 2) * 0.002;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} visible={marsProgress > 0}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#e05020"
        transparent
        opacity={marsProgress * 0.6}
        sizeAttenuation
      />
    </points>
  );
}
