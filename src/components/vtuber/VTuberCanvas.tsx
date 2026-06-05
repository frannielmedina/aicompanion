'use client';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useStore } from '@/store';

// Procedural anime-style VTuber character
function VTuberMesh({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const hairRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);

  const blinkTimer = useRef(0);
  const blinkState = useRef(0);
  const mouthTimer = useRef(0);
  const floatTimer = useRef(0);
  const tailTimer = useRef(0);

  // Materials
  const skinMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#fde8d8' }), []);
  const hairMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#a855f7' }), []);
  const eyeMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#7c3aed' }), []);
  const pupilMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#1a0033' }), []);
  const eyeWhiteMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ffffff' }), []);
  const clothMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#7c3aed' }), []);
  const clothTrimMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ec4899' }), []);
  const mouthMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#f43f5e' }), []);
  const teethMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ffffff' }), []);
  const earMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#d4a0f0' }), []);
  const blushMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#f9a8d4', transparent: true, opacity: 0.5 }), []);

  useFrame((_, delta) => {
    floatTimer.current += delta;
    tailTimer.current += delta;

    // Floating idle
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(floatTimer.current * 1.2) * 0.06;
      groupRef.current.rotation.y = Math.sin(floatTimer.current * 0.5) * 0.08;
    }

    // Thinking head tilt
    if (headRef.current) {
      const targetTilt = isThinking ? 0.25 : 0;
      headRef.current.rotation.z += (targetTilt - headRef.current.rotation.z) * 0.05;
      headRef.current.rotation.x = Math.sin(floatTimer.current * 0.8) * 0.02;
    }

    // Hair sway
    if (hairRef.current) {
      hairRef.current.rotation.z = Math.sin(floatTimer.current * 0.9) * 0.04;
    }

    // Blink
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() * 2) {
      blinkState.current = 1;
      blinkTimer.current = 0;
    }
    if (leftEyeRef.current && rightEyeRef.current) {
      if (blinkState.current > 0) {
        blinkState.current += delta * 8;
        const sc = blinkState.current < 1 ? 1 - blinkState.current : blinkState.current - 1;
        const eyeScale = Math.max(0.05, sc);
        leftEyeRef.current.scale.y = eyeScale;
        rightEyeRef.current.scale.y = eyeScale;
        if (blinkState.current > 2) blinkState.current = 0;
      } else {
        leftEyeRef.current.scale.y += (1 - leftEyeRef.current.scale.y) * 0.2;
        rightEyeRef.current.scale.y += (1 - rightEyeRef.current.scale.y) * 0.2;
      }
    }

    // Lip sync
    mouthTimer.current += delta;
    if (mouthRef.current) {
      if (isSpeaking) {
        const mouthOpen = (Math.sin(mouthTimer.current * 12) * 0.5 + 0.5) * 0.12;
        mouthRef.current.scale.y = 0.3 + mouthOpen * 3;
        mouthRef.current.position.y = -0.22 - mouthOpen * 0.5;
      } else {
        mouthRef.current.scale.y += (1 - mouthRef.current.scale.y) * 0.1;
      }
    }

    // Body bounce when speaking
    if (bodyRef.current && isSpeaking) {
      bodyRef.current.position.y = -0.85 + Math.sin(mouthTimer.current * 6) * 0.01;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.35, 0]} material={skinMat}>
        <cylinderGeometry args={[0.09, 0.12, 0.25, 16]} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, -0.85, 0]} material={clothMat}>
        <cylinderGeometry args={[0.28, 0.32, 0.8, 16]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, -0.5, 0.15]} material={clothTrimMat}>
        <boxGeometry args={[0.3, 0.08, 0.08]} />
      </mesh>
      {/* Chest bow */}
      <mesh position={[0, -0.62, 0.22]} rotation={[0, 0, 0]} material={clothTrimMat}>
        <boxGeometry args={[0.18, 0.06, 0.04]} />
      </mesh>

      {/* Arms */}
      <mesh position={[0.38, -0.75, 0]} rotation={[0, 0, 0.3]} material={clothMat}>
        <cylinderGeometry args={[0.07, 0.06, 0.45, 12]} />
      </mesh>
      <mesh position={[-0.38, -0.75, 0]} rotation={[0, 0, -0.3]} material={clothMat}>
        <cylinderGeometry args={[0.07, 0.06, 0.45, 12]} />
      </mesh>
      {/* Hands */}
      <mesh position={[0.48, -0.95, 0]} material={skinMat}>
        <sphereGeometry args={[0.075, 12, 12]} />
      </mesh>
      <mesh position={[-0.48, -0.95, 0]} material={skinMat}>
        <sphereGeometry args={[0.075, 12, 12]} />
      </mesh>

      {/* Head */}
      <group ref={headRef as any} position={[0, 0, 0]}>
        {/* Head shape */}
        <mesh position={[0, 0.05, 0]} material={skinMat}>
          <sphereGeometry args={[0.38, 32, 32]} />
        </mesh>
        {/* Chin */}
        <mesh position={[0, -0.28, 0]} material={skinMat}>
          <sphereGeometry args={[0.22, 16, 16]} />
        </mesh>

        {/* Blush */}
        <mesh position={[0.28, -0.02, 0.3]} rotation={[0, 0.3, 0]} material={blushMat}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
        <mesh position={[-0.28, -0.02, 0.3]} rotation={[0, -0.3, 0]} material={blushMat}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>

        {/* Ears (cat ears!) */}
        <mesh ref={leftEarRef} position={[0.28, 0.38, 0]} rotation={[0, 0, -0.3]} material={hairMat}>
          <coneGeometry args={[0.09, 0.22, 12]} />
        </mesh>
        <mesh position={[0.28, 0.38, 0]} rotation={[0, 0, -0.3]} material={earMat}>
          <coneGeometry args={[0.05, 0.16, 8]} />
        </mesh>
        <mesh ref={rightEarRef} position={[-0.28, 0.38, 0]} rotation={[0, 0, 0.3]} material={hairMat}>
          <coneGeometry args={[0.09, 0.22, 12]} />
        </mesh>
        <mesh position={[-0.28, 0.38, 0]} rotation={[0, 0, 0.3]} material={earMat}>
          <coneGeometry args={[0.05, 0.16, 8]} />
        </mesh>

        {/* Eyes - whites */}
        <mesh ref={leftEyeRef} position={[0.14, 0.06, 0.34]}>
          <circleGeometry args={[0.095, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh ref={rightEyeRef} position={[-0.14, 0.06, 0.34]}>
          <circleGeometry args={[0.095, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Irises */}
        <mesh position={[0.14, 0.06, 0.35]}>
          <circleGeometry args={[0.072, 16]} />
          <meshBasicMaterial color="#7c3aed" />
        </mesh>
        <mesh position={[-0.14, 0.06, 0.35]}>
          <circleGeometry args={[0.072, 16]} />
          <meshBasicMaterial color="#7c3aed" />
        </mesh>
        {/* Pupils */}
        <mesh position={[0.14, 0.055, 0.36]}>
          <circleGeometry args={[0.038, 12]} />
          <meshBasicMaterial color="#0a001a" />
        </mesh>
        <mesh position={[-0.14, 0.055, 0.36]}>
          <circleGeometry args={[0.038, 12]} />
          <meshBasicMaterial color="#0a001a" />
        </mesh>
        {/* Eye shine */}
        <mesh position={[0.155, 0.075, 0.37]}>
          <circleGeometry args={[0.018, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.125, 0.075, 0.37]}>
          <circleGeometry args={[0.018, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[0.14, 0.19, 0.35]} rotation={[0, 0, isThinking ? 0.3 : 0.1]}>
          <boxGeometry args={[0.13, 0.025, 0.01]} />
          <meshBasicMaterial color="#6b21a8" />
        </mesh>
        <mesh position={[-0.14, 0.19, 0.35]} rotation={[0, 0, isThinking ? -0.3 : -0.1]}>
          <boxGeometry args={[0.13, 0.025, 0.01]} />
          <meshBasicMaterial color="#6b21a8" />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.05, 0.37]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#f4a0b0" />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.22, 0.35]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>

        {/* Hair group */}
        <group ref={hairRef as any}>
          {/* Top hair */}
          <mesh position={[0, 0.32, 0]} material={hairMat}>
            <sphereGeometry args={[0.39, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Side bangs */}
          <mesh position={[0.3, 0.12, 0.2]} rotation={[0.2, 0.5, 0.2]} material={hairMat}>
            <boxGeometry args={[0.14, 0.35, 0.1]} />
          </mesh>
          <mesh position={[-0.3, 0.12, 0.2]} rotation={[0.2, -0.5, -0.2]} material={hairMat}>
            <boxGeometry args={[0.14, 0.35, 0.1]} />
          </mesh>
          {/* Front bangs */}
          <mesh position={[0.12, 0.28, 0.35]} rotation={[0.4, 0, 0.15]} material={hairMat}>
            <boxGeometry args={[0.13, 0.28, 0.1]} />
          </mesh>
          <mesh position={[-0.12, 0.28, 0.35]} rotation={[0.4, 0, -0.15]} material={hairMat}>
            <boxGeometry args={[0.13, 0.28, 0.1]} />
          </mesh>
          <mesh position={[0, 0.25, 0.37]} rotation={[0.5, 0, 0]} material={hairMat}>
            <boxGeometry args={[0.1, 0.22, 0.08]} />
          </mesh>
          {/* Long back hair */}
          <mesh position={[0, -0.6, -0.22]} rotation={[-0.1, 0, 0]} material={hairMat}>
            <boxGeometry args={[0.52, 0.9, 0.12]} />
          </mesh>
          {/* Hair ribbons */}
          <mesh position={[0.32, 0.22, -0.1]} material={clothTrimMat}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function VTuberCanvas({ className }: { className?: string }) {
  const { isSpeaking, isThinking, settings } = useStore();
  const bgColor = settings.greenScreenColor;

  return (
    <div className={className} style={{ background: bgColor }}>
      <Canvas camera={{ position: [0, 0.1, 2.2], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={[bgColor]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#a78bfa" />
        <pointLight position={[0, 2, 2]} intensity={0.5} color="#ec4899" />
        <VTuberMesh isSpeaking={isSpeaking} isThinking={isThinking} />
      </Canvas>
    </div>
  );
}
