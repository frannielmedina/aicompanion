'use client';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useStore } from '@/store';

interface Props {
  className?: string;
  transparent?: boolean;
}

function getVRMVersion(gltf: any): 0 | 1 {
  const ext = gltf?.parser?.json?.extensions;
  if (ext?.VRM) return 0;
  if (ext?.VRMC_vrm) return 1;
  const vrm = gltf?.userData?.vrm;
  if (vrm?.meta?.specVersion) return vrm.meta.specVersion.startsWith('1') ? 1 : 0;
  return 1;
}

export default function VTuberCanvas({ className, transparent = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, isThinking, settings } = useStore();
  const vrmRef = useRef<any>(null);
  const vrmVersionRef = useRef<0 | 1>(1);
  const clockRef = useRef(new THREE.Clock());
  const stateRef = useRef({ isSpeaking: false, isThinking: false });
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => { stateRef.current = { isSpeaking, isThinking }; }, [isSpeaking, isThinking]);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    const scene = new THREE.Scene();
    const hasCustomBg = !!settings.customBgDataUrl;
    if (transparent) {
      scene.background = null;
    } else if (hasCustomBg) {
      scene.background = null;
    } else {
      scene.background = new THREE.Color(settings.greenScreenColor);
    }

    const camera = new THREE.PerspectiveCamera(30, el.clientWidth / el.clientHeight, 0.1, 20);
    camera.position.set(0, 1.4, 2.8);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent || hasCustomBg });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    if (transparent || hasCustomBg) renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.4);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xec4899, 0.5, 10);
    rimLight.position.set(0, 2, -1);
    scene.add(rimLight);

    const anim = { blinkTimer: 0, blinkPhase: 0 as number, floatTimer: 0, mouthTimer: 0, breathTimer: 0, headSwayTimer: 0 };

    const vrmUrl = settings.customVrmUrl || '/vrm/miko.vrm';
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        if (!vrm) { setLoadStatus('error'); return; }

        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        const version = getVRMVersion(gltf);
        vrmVersionRef.current = version;

        // VRM 0.x faces +Z (back to camera) → rotate 180° to face camera
        vrm.scene.rotation.y = version === 0 ? Math.PI : 0;

        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // ── Pose arms down ───────────────────────────────────────────
        // For VRM 0.x, the normalized humanoid API from @pixiv/three-vrm
        // re-maps bones so that the coordinate system matches VRM 1.x.
        // HOWEVER the scene is rotated 180° on Y, which mirrors left/right,
        // so we need to flip the Z sign for arm bones.
        const hb = vrm.humanoid;

        const setBone = (name: VRMHumanBoneName, rx: number, ry: number, rz: number) => {
          const bone = hb?.getNormalizedBoneNode(name);
          if (!bone) return;
          bone.rotation.set(rx, ry, rz);
        };

        if (version === 0) {
          // Mirrored Z because the whole scene is rotated 180° on Y.
          // Positive Z now brings arms down for both sides.
          setBone(VRMHumanBoneName.LeftUpperArm,  0.1, 0,  1.2);
          setBone(VRMHumanBoneName.RightUpperArm, 0.1, 0, -1.2);
          setBone(VRMHumanBoneName.LeftLowerArm,  0,   0, -0.1);
          setBone(VRMHumanBoneName.RightLowerArm, 0,   0,  0.1);
        } else {
          setBone(VRMHumanBoneName.LeftUpperArm,  0.1, 0, -1.2);
          setBone(VRMHumanBoneName.RightUpperArm, 0.1, 0,  1.2);
          setBone(VRMHumanBoneName.LeftLowerArm,  0,   0,  0.1);
          setBone(VRMHumanBoneName.RightLowerArm, 0,   0, -0.1);
        }

        setLoadStatus('ready');
      },
      (progress) => { if (progress.total > 0) setLoadProgress(Math.round((progress.loaded / progress.total) * 100)); },
      (error) => { console.error('VRM load error:', error); setLoadStatus('error'); }
    );

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const vrm = vrmRef.current;
      if (!vrm) { renderer.render(scene, camera); return; }

      const { isSpeaking, isThinking } = stateRef.current;
      const version = vrmVersionRef.current;

      anim.floatTimer   += delta;
      anim.breathTimer  += delta;
      anim.headSwayTimer+= delta;
      anim.mouthTimer   += delta;
      anim.blinkTimer   += delta;

      const eb = vrm.expressionManager;
      const hb = vrm.humanoid;

      // Float
      vrm.scene.position.y = Math.sin(anim.floatTimer * 1.1) * 0.025;

      // Head sway
      const headBone = hb?.getNormalizedBoneNode(VRMHumanBoneName.Head);
      if (headBone) {
        const targetZ = isThinking ? 0.18 : Math.sin(anim.headSwayTimer * 0.45) * 0.04;
        headBone.rotation.z += (targetZ - headBone.rotation.z) * 0.06;
        headBone.rotation.x += (Math.sin(anim.headSwayTimer * 0.6) * 0.02 - headBone.rotation.x) * 0.06;
        headBone.rotation.y += (Math.sin(anim.headSwayTimer * 0.3) * 0.03 - headBone.rotation.y) * 0.06;
      }

      const neckBone = hb?.getNormalizedBoneNode(VRMHumanBoneName.Neck);
      if (neckBone) neckBone.rotation.z = Math.sin(anim.headSwayTimer * 0.4) * 0.015;

      const spineBone = hb?.getNormalizedBoneNode(VRMHumanBoneName.Spine);
      if (spineBone) spineBone.rotation.x = Math.sin(anim.breathTimer * 0.9) * 0.012;

      // Arms — sign of Z flipped for VRM 0.x (mirrored world)
      const zSign = version === 0 ? -1 : 1;

      const leftUpper  = hb?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
      const rightUpper = hb?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
      const leftLower  = hb?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
      const rightLower = hb?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);

      if (leftUpper) {
        const tz = zSign * (-1.2 + Math.sin(anim.floatTimer * 0.8) * 0.04);
        leftUpper.rotation.z += (tz - leftUpper.rotation.z) * 0.08;
        leftUpper.rotation.x += ((0.1 + Math.sin(anim.floatTimer * 0.6) * 0.02) - leftUpper.rotation.x) * 0.08;
      }
      if (rightUpper) {
        const tz = zSign * (1.2 + Math.sin(anim.floatTimer * 0.8 + 0.5) * 0.04);
        rightUpper.rotation.z += (tz - rightUpper.rotation.z) * 0.08;
        rightUpper.rotation.x += ((0.1 + Math.sin(anim.floatTimer * 0.6 + 0.5) * 0.02) - rightUpper.rotation.x) * 0.08;
      }
      if (leftLower)  leftLower.rotation.z  += (zSign *  0.1 - leftLower.rotation.z)  * 0.05;
      if (rightLower) rightLower.rotation.z += (zSign * -0.1 - rightLower.rotation.z) * 0.05;

      // Expressions
      if (eb) {
        // Blink
        if (anim.blinkTimer > 3.5 + Math.random() * 2.5 && anim.blinkPhase === 0) {
          anim.blinkPhase = 1; anim.blinkTimer = 0;
        }
        if (anim.blinkPhase === 1) {
          const v = Math.min(1, anim.blinkTimer * 14);
          eb.setValue('blink', v);
          if (v >= 1) { anim.blinkPhase = 2; anim.blinkTimer = 0; }
        } else if (anim.blinkPhase === 2) {
          const v = Math.max(0, 1 - anim.blinkTimer * 14);
          eb.setValue('blink', v);
          if (v <= 0) { anim.blinkPhase = 0; anim.blinkTimer = 0; }
        }

        // Mouth
        if (isSpeaking) {
          const t = anim.mouthTimer;
          const openAmount = (Math.sin((t * 4.5) % (Math.PI * 2)) * 0.5 + 0.5) * 0.85;
          const visemes = ['aa', 'ih', 'ou', 'ee', 'oh'];
          ['aa', 'ih', 'ou', 'ee', 'oh', 'nn'].forEach((v) => { try { eb.setValue(v, 0); } catch {} });
          try { eb.setValue(visemes[Math.floor(t * 3.5) % 5], openAmount); } catch {}
          try { eb.setValue('happy', Math.sin(t * 2) * 0.1 + 0.1); } catch {}
        } else {
          ['aa', 'ih', 'ou', 'ee', 'oh', 'nn', 'a', 'i', 'u', 'e', 'o'].forEach((v) => {
            try { eb.setValue(v, 0); } catch {}
          });
        }

        if (isThinking) { try { eb.setValue('thinking', Math.min(1, anim.headSwayTimer * 2)); } catch {} }
        else { try { eb.setValue('thinking', 0); } catch {} }
      }

      vrm.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [settings.greenScreenColor, settings.customVrmUrl, settings.customBgDataUrl, transparent]);

  return (
    <div className={className} style={{ position: 'relative', background: 'transparent' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {loadStatus === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/90 z-10">
          <div className="text-4xl mb-4 animate-bounce">🌸</div>
          <p className="text-white font-bold mb-3" style={{ fontFamily: '"Comic Sans MS", cursive' }}>Loading...</p>
          <div className="w-48 h-2 bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-accent-primary rounded-full transition-all duration-300" style={{ width: `${loadProgress}%` }} />
          </div>
          <p className="text-gray-400 text-sm mt-2">{loadProgress}%</p>
        </div>
      )}

      {loadStatus === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/90 z-10">
          <p className="text-red-400 text-lg mb-2">⚠️ Failed to load VRM</p>
          <p className="text-gray-400 text-sm">Check that a VRM file is available</p>
        </div>
      )}
    </div>
  );
}
