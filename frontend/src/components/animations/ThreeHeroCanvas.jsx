import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium 3D Interactive Cyber Wave Mesh & Fluid Grid
 * Powered by Three.js
 * Creates an elegant, organic undulating 3D wave ribbon with mouse wave ripples
 */
export function ThreeHeroCanvas({ className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 18, 48);
    camera.lookAt(0, -2, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. 3D Wave Plane Geometry
    const gridX = 55;
    const gridY = 40;
    const width = 110;
    const height = 75;
    const planeGeo = new THREE.PlaneGeometry(width, height, gridX, gridY);
    planeGeo.rotateX(-Math.PI / 2.3);

    // Store original coordinate positions for smooth sinusoidal animation
    const originalPositions = Float32Array.from(planeGeo.attributes.position.array);

    // Vertex Colors for vibrant violet -> indigo -> cyan gradient
    const count = planeGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color('#8b5cf6'); // Royal Purple
    const colorB = new THREE.Color('#6366f1'); // Indigo
    const colorC = new THREE.Color('#38bdf8'); // Sky Cyan

    for (let i = 0; i < count; i++) {
      const u = (i % (gridX + 1)) / gridX;
      const v = Math.floor(i / (gridX + 1)) / gridY;

      const mixed = new THREE.Color();
      if (u < 0.5) {
        mixed.lerpColors(colorA, colorB, u * 2);
      } else {
        mixed.lerpColors(colorB, colorC, (u - 0.5) * 2);
      }

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 3. Materials: Sleek Wireframe Grid + Glowing Points
    const wireMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });

    const mesh = new THREE.Mesh(planeGeo, wireMaterial);
    scene.add(mesh);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const pointsMesh = new THREE.Points(planeGeo, pointsMaterial);
    scene.add(pointsMesh);

    // Floating 3D ambient crystal orbs
    const orbsGroup = new THREE.Group();
    const orbGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    const orbs = [];
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(
        (Math.random() - 0.5) * 70,
        Math.random() * 15 + 2,
        (Math.random() - 0.5) * 40
      );
      orb.scale.setScalar(Math.random() * 1.5 + 0.8);
      orbs.push({
        mesh: orb,
        speedX: (Math.random() - 0.5) * 0.015,
        speedY: Math.random() * 0.02 + 0.01,
        rotSpeed: Math.random() * 0.02 + 0.01,
      });
      orbsGroup.add(orb);
    }
    scene.add(orbsGroup);

    // 4. Mouse Interactive Raycasting & Smooth Physics
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / container.clientWidth - 0.5) * 2;
      mouseY = -((event.clientY - rect.top) / container.clientHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth Camera tracking
      targetX += (mouseX * 10 - targetX) * 0.04;
      targetY += (mouseY * 6 - targetY) * 0.04;

      camera.position.x = targetX;
      camera.position.y = 18 + targetY;
      camera.lookAt(0, -2, 0);

      // Animate 3D Wave heights with harmonic compound sines
      const positions = planeGeo.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];

        // Complex organic fluid wave calculation
        const wave1 = Math.sin(x * 0.12 + elapsedTime * 1.4) * 3.5;
        const wave2 = Math.cos(z * 0.14 + elapsedTime * 1.1) * 2.8;
        const wave3 = Math.sin((x + z) * 0.08 + elapsedTime * 0.9) * 2.0;

        // Interactive mouse swell near cursor
        const distToMouse = Math.hypot(x - targetX * 3, z - targetY * 2);
        const mouseRipple = Math.sin(distToMouse * 0.3 - elapsedTime * 3) * Math.max(0, 4 - distToMouse * 0.1);

        positions[i * 3 + 1] = y + wave1 + wave2 + wave3 + mouseRipple;
      }

      planeGeo.attributes.position.needsUpdate = true;

      // Animate ambient crystal orbs
      orbs.forEach(({ mesh: oMesh, rotSpeed, speedY }) => {
        oMesh.rotation.x += rotSpeed;
        oMesh.rotation.y += rotSpeed * 0.8;
        oMesh.position.y += Math.sin(elapsedTime * 1.5 + oMesh.position.x) * 0.025;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 6. Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      planeGeo.dispose();
      wireMaterial.dispose();
      pointsMaterial.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default ThreeHeroCanvas;
