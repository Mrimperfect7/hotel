'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 8;
    camera.position.y = 0.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff3d6, 1.2);
    scene.add(ambientLight);

    const goldPointLight = new THREE.PointLight(0xdfa92c, 3, 20);
    goldPointLight.position.set(2, 2, 4);
    scene.add(goldPointLight);

    const bluePointLight = new THREE.PointLight(0x2b5597, 2, 20);
    bluePointLight.position.set(-3, -2, 2);
    scene.add(bluePointLight);

    // 1. Sacred Golden Rings (Mandala / Celestial halo)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // Outer Torus Ring
    const outerRingGeo = new THREE.TorusGeometry(3.6, 0.035, 16, 100);
    const goldMat1 = new THREE.MeshStandardMaterial({
      color: 0xdfa92c,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x6e4017,
      emissiveIntensity: 0.4,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, goldMat1);
    ringGroup.add(outerRing);

    // Middle Ring with Dashed/Beaded Points
    const midRingGeo = new THREE.TorusGeometry(2.6, 0.025, 16, 80);
    const goldMat2 = new THREE.MeshStandardMaterial({
      color: 0xf2d88a,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0xa86d12,
      emissiveIntensity: 0.5,
    });
    const midRing = new THREE.Mesh(midRingGeo, goldMat2);
    midRing.rotation.x = Math.PI * 0.25;
    ringGroup.add(midRing);

    // Inner Ring
    const innerRingGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 60);
    const goldMat3 = new THREE.MeshStandardMaterial({
      color: 0xffe28a,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xdfa92c,
      emissiveIntensity: 0.6,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, goldMat3);
    innerRing.rotation.y = Math.PI * 0.35;
    ringGroup.add(innerRing);

    // Central Sacred Glowing Core (Pulsing Nilavilakku Golden Core)
    const coreGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf8d775,
      wireframe: true,
      emissive: 0xdfa92c,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const centralCore = new THREE.Mesh(coreGeo, coreMat);
    ringGroup.add(centralCore);

    // 2. Soft Glowing Golden Particle System (Temple Embers & Stardust)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    // Soft glowing circle sprite generated via 2D Canvas
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const pCtx = particleCanvas.getContext('2d');
    if (pCtx) {
      const gradient = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 245, 210, 1)');
      gradient.addColorStop(0.2, 'rgba(242, 216, 138, 0.85)');
      gradient.addColorStop(0.5, 'rgba(223, 169, 44, 0.35)');
      gradient.addColorStop(1, 'rgba(223, 169, 44, 0)');
      pCtx.fillStyle = gradient;
      pCtx.beginPath();
      pCtx.arc(32, 32, 32, 0, Math.PI * 2);
      pCtx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    for (let i = 0; i < particleCount; i++) {
      // Spread across 3D space
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Drift velocities
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = 0.002 + Math.random() * 0.004; // gently floating upward
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;

      scales[i] = 0.5 + Math.random() * 0.8;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Tracking for Interactive 3D Parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.targetX = (x - 0.5) * 2;
      mouse.targetY = (y - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Parallax camera rotation and position
      camera.position.x = mouse.x * 1.2;
      camera.position.y = 0.5 - mouse.y * 0.8;
      camera.lookAt(0, 0, 0);

      // Rotate sacred rings at celestial harmonics
      ringGroup.rotation.y = elapsedTime * 0.15 + mouse.x * 0.4;
      ringGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15 + mouse.y * 0.3;

      midRing.rotation.z = -elapsedTime * 0.12;
      innerRing.rotation.x = elapsedTime * 0.2;

      // Core pulse
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.08;
      centralCore.scale.set(pulse, pulse, pulse);
      centralCore.rotation.y = -elapsedTime * 0.4;

      // Floating light intensity wave
      goldPointLight.intensity = 2.5 + Math.sin(elapsedTime * 1.8) * 0.8;

      // Update particles
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 0] += velocities[i * 3 + 0] + Math.sin(elapsedTime + i) * 0.001;
        posArr[i * 3 + 1] += velocities[i * 3 + 1];
        posArr[i * 3 + 2] += velocities[i * 3 + 2];

        // Reset if float out of top bound
        if (posArr[i * 3 + 1] > 6) {
          posArr[i * 3 + 1] = -5;
          posArr[i * 3 + 0] = (Math.random() - 0.5) * 16;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose Three.js objects
      outerRingGeo.dispose();
      midRingGeo.dispose();
      innerRingGeo.dispose();
      coreGeo.dispose();
      particleGeo.dispose();
      particleTexture.dispose();

      goldMat1.dispose();
      goldMat2.dispose();
      goldMat3.dispose();
      coreMat.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {!hasWebGL && (
        <div
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            backgroundImage:
              'radial-gradient(circle at 75% 25%, #dfa92c 0, transparent 50%), radial-gradient(circle at 20% 80%, #3f9d63 0, transparent 45%)',
          }}
        />
      )}
    </div>
  );
}
