import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sounds } from './soundEffects';

interface OfflineVegasStrip3DProps {
  onCoordsChange?: (coords: { lat: number; lng: number; heading: number; speedMph: number }) => void;
  isSprinting?: boolean;
  onPedestrianNearby?: (ped: { id: string; name: string; role: string; dialogue: string; reward: number; isBlessed: boolean } | null) => void;
  onMiracleTriggered?: (miracleId: string) => void;
  travelStance?: 'ROBES_WALK' | 'GOLDEN_CHARIOT';
  onSceneReady?: (scene: THREE.Scene) => void;
}

export const OfflineVegasStrip3D: React.FC<OfflineVegasStrip3DProps> = ({
  onCoordsChange,
  isSprinting = false,
  onPedestrianNearby,
  travelStance = 'ROBES_WALK',
  onSceneReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070913); // Deep Vegas midnight blue
    scene.fog = new THREE.FogExp2(0x070913, 0.008);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Vegas Strip Ambient + Neon Streetlights)
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.2);
    scene.add(ambientLight);

    if (onSceneReady) {
      onSceneReady(scene);
    }

    const moonLight = new THREE.DirectionalLight(0xa5b4fc, 0.8);
    moonLight.position.set(50, 100, 50);
    scene.add(moonLight);

    // 3. The Las Vegas Boulevard (Asphalt Highway & Sidewalks)
    // Strip runs along Z-axis (North/South) from -500 to +500
    const roadWidth = 24;
    const roadLength = 1000;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0;
    scene.add(roadMesh);

    // Yellow double center lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const centerLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roadLength), lineMat);
    centerLine1.rotation.x = -Math.PI / 2;
    centerLine1.position.set(-0.3, 0.02, 0);
    scene.add(centerLine1);

    const centerLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roadLength), lineMat);
    centerLine2.rotation.x = -Math.PI / 2;
    centerLine2.position.set(0.3, 0.02, 0);
    scene.add(centerLine2);

    // Sidewalks
    const sidewalkWidth = 10;
    const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.3, roadLength);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 });

    const westSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    westSidewalk.position.set(-(roadWidth / 2 + sidewalkWidth / 2), 0.15, 0);
    scene.add(westSidewalk);

    const eastSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    eastSidewalk.position.set(roadWidth / 2 + sidewalkWidth / 2, 0.15, 0);
    scene.add(eastSidewalk);

    // 4. Iconic Las Vegas Strip 3D Landmarks

    // A. THE SPHERE (East side, Z = -120)
    const sphereGroup = new THREE.Group();
    sphereGroup.position.set(50, 0, -120);
    const sphereGeo = new THREE.SphereGeometry(28, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      wireframe: false,
      roughness: 0.3
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGroup.add(sphereMesh);
    scene.add(sphereGroup);

    // Sphere Point Light
    const sphereLight = new THREE.PointLight(0x06b6d4, 3, 90);
    sphereLight.position.set(50, 20, -120);
    scene.add(sphereLight);

    // B. LUXOR PYRAMID & SKY BEAM (West side, Z = 160)
    const luxorGroup = new THREE.Group();
    luxorGroup.position.set(-60, 0, 160);
    const pyramidGeo = new THREE.ConeGeometry(38, 45, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8
    });
    const pyramidMesh = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramidMesh.rotation.y = Math.PI / 4;
    pyramidMesh.position.y = 22.5;
    luxorGroup.add(pyramidMesh);

    // Luxor Vertical Sky Beam
    const beamGeo = new THREE.CylinderGeometry(1.5, 6, 250, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xe0e7ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 150;
    luxorGroup.add(beamMesh);
    scene.add(luxorGroup);

    // C. BELLAGIO RESORT & FOUNTAIN LAKE (West side, Z = -20)
    const bellagioGroup = new THREE.Group();
    bellagioGroup.position.set(-65, 0, -20);
    // Resort Tower
    const bellagioTower = new THREE.Mesh(
      new THREE.BoxGeometry(60, 65, 25),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    bellagioTower.position.y = 32.5;
    bellagioGroup.add(bellagioTower);

    // Bellagio Fountain Pool
    const poolMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 70),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.5 })
    );
    poolMesh.rotation.x = -Math.PI / 2;
    poolMesh.position.set(30, 0.05, 0);
    bellagioGroup.add(poolMesh);
    scene.add(bellagioGroup);

    // D. CAESARS PALACE (West side, Z = -90)
    const caesarsGroup = new THREE.Group();
    caesarsGroup.position.set(-60, 0, -90);
    const caesarsBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(45, 55, 30),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
    );
    caesarsBuilding.position.y = 27.5;
    caesarsGroup.add(caesarsBuilding);
    scene.add(caesarsGroup);

    // E. THE STRAT TOWER (East side, Z = -350)
    const stratGroup = new THREE.Group();
    stratGroup.position.set(55, 0, -350);
    // Shaft
    const stratShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 4, 140, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    stratShaft.position.y = 70;
    stratGroup.add(stratShaft);
    // Pod
    const stratPod = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 14, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.5 })
    );
    stratPod.position.y = 135;
    stratGroup.add(stratPod);
    // Needle
    const stratNeedle = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 45, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
    );
    stratNeedle.position.y = 162.5;
    stratGroup.add(stratNeedle);
    scene.add(stratGroup);

    // Generic Vegas Casino Facades & Neon Billboards along both sides
    const casinoColors = [0xdb2777, 0x7c3aed, 0x2563eb, 0x059669, 0xd97706];
    for (let i = -4; i <= 4; i++) {
      if (Math.abs(i) <= 1) continue; // Leave room for featured landmarks
      const zPos = i * 65;

      // East side building
      const h1 = 30 + Math.random() * 40;
      const b1 = new THREE.Mesh(
        new THREE.BoxGeometry(35, h1, 35),
        new THREE.MeshStandardMaterial({
          color: casinoColors[Math.abs(i) % casinoColors.length],
          roughness: 0.6
        })
      );
      b1.position.set(55, h1 / 2, zPos);
      scene.add(b1);

      // West side building
      const h2 = 30 + Math.random() * 40;
      const b2 = new THREE.Mesh(
        new THREE.BoxGeometry(35, h2, 35),
        new THREE.MeshStandardMaterial({
          color: casinoColors[(Math.abs(i) + 2) % casinoColors.length],
          roughness: 0.6
        })
      );
      b2.position.set(-55, h2 / 2, zPos + 25);
      scene.add(b2);
    }

    // Streetlights along both curbs
    for (let z = -450; z <= 450; z += 45) {
      // East pole
      const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const p1 = new THREE.Mesh(poleGeo, poleMat);
      p1.position.set(roadWidth / 2 + 0.5, 3.5, z);
      scene.add(p1);

      const lamp1 = new THREE.PointLight(0xfef08a, 1.2, 30);
      lamp1.position.set(roadWidth / 2 + 0.5, 7, z);
      scene.add(lamp1);

      // West pole
      const p2 = new THREE.Mesh(poleGeo, poleMat);
      p2.position.set(-(roadWidth / 2 + 0.5), 3.5, z);
      scene.add(p2);

      const lamp2 = new THREE.PointLight(0xfef08a, 1.2, 30);
      lamp2.position.set(-(roadWidth / 2 + 0.5), 7, z);
      scene.add(lamp2);
    }

    // 5. 3D Vegas Traffic System (Moving cars on the Strip)
    const trafficCars: { mesh: THREE.Group; speed: number; laneX: number; dir: number }[] = [];
    const carColors = [0xfacc15, 0xef4444, 0x3b82f6, 0x10b981, 0x000000, 0xffffff];

    for (let c = 0; c < 12; c++) {
      const carGroup = new THREE.Group();
      const color = carColors[c % carColors.length];

      // Chassis
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.1, 4.5),
        new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
      );
      body.position.y = 0.65;
      carGroup.add(body);

      // Cabin / windshield
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.9, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 })
      );
      cabin.position.set(0, 1.45, -0.3);
      carGroup.add(cabin);

      // Headlights / Taillights
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      headL.position.set(-0.8, 0.7, -2.26);
      carGroup.add(headL);
      const headR = headL.clone();
      headR.position.x = 0.8;
      carGroup.add(headR);

      // Northbound or Southbound lane
      const isNorthbound = c % 2 === 0;
      const laneX = isNorthbound ? -5 - (c % 2) * 4 : 5 + (c % 2) * 4;
      const dir = isNorthbound ? -1 : 1;
      carGroup.position.set(laneX, 0, (Math.random() - 0.5) * 600);
      carGroup.rotation.y = isNorthbound ? 0 : Math.PI;

      scene.add(carGroup);
      trafficCars.push({
        mesh: carGroup,
        speed: 0.6 + Math.random() * 0.4,
        laneX,
        dir
      });
    }

    // 6. 3D JESUS PLAYER CHARACTER
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 0); // Start on Las Vegas Blvd

    // A. Pulsing Golden Halo
    const haloGeo = new THREE.TorusGeometry(0.65, 0.08, 16, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.y = 3.2;
    playerGroup.add(haloMesh);

    // Halo Point Light casting warm radiance onto the street
    const haloLight = new THREE.PointLight(0xfde047, 1.5, 12);
    haloLight.position.y = 3.2;
    playerGroup.add(haloLight);

    // B. Head & Face
    const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.8 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 2.4;
    playerGroup.add(headMesh);

    // Beard
    const beardGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.4, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
    const beardMesh = new THREE.Mesh(beardGeo, hairMat);
    beardMesh.position.set(0, 2.1, 0.2);
    playerGroup.add(beardMesh);

    // C. Flowing White Robes
    const robeGeo = new THREE.CylinderGeometry(0.5, 0.85, 2.1, 16);
    const robeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const robeMesh = new THREE.Mesh(robeGeo, robeMat);
    robeMesh.position.y = 1.15;
    playerGroup.add(robeMesh);

    // D. Crimson Sash / Mantle
    const sashGeo = new THREE.CylinderGeometry(0.52, 0.86, 2.0, 16, 1, false, 0, Math.PI * 0.8);
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.6 });
    const sashMesh = new THREE.Mesh(sashGeo, sashMat);
    sashMesh.position.y = 1.15;
    playerGroup.add(sashMesh);

    scene.add(playerGroup);

    // 7. Interactive Sidewalk Pedestrians in 3D Space
    const offlinePeds = [
      {
        id: 'ped-marcus',
        name: 'Marcus the Desperate Gambler',
        role: 'Outside Bellagio',
        dialogue: '"Down to my last $10... praying for a sign."',
        reward: 1200,
        isBlessed: false,
        pos: new THREE.Vector3(-14, 0.15, -25)
      },
      {
        id: 'ped-elvis',
        name: 'Johnny "The King" Presley',
        role: 'Near Caesars Forum',
        dialogue: '"Thank you very much... but deep down inside, I need peace."',
        reward: 2500,
        isBlessed: false,
        pos: new THREE.Vector3(-14, 0.15, -85)
      },
      {
        id: 'ped-roxy',
        name: 'Roxy the Cocktail Waitress',
        role: 'Outside The Sphere',
        dialogue: '"On hour 14 carrying heavy trays... feet burning."',
        reward: 850,
        isBlessed: false,
        pos: new THREE.Vector3(14, 0.15, -115)
      }
    ];

    const pedMeshes: THREE.Group[] = [];
    offlinePeds.forEach(p => {
      const g = new THREE.Group();
      g.position.copy(p.pos);

      // Pedestrian Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x64748b })
      );
      body.position.y = 0.9;
      g.add(body);

      // Floating Marker
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.3),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      marker.position.y = 2.4;
      g.add(marker);

      scene.add(g);
      pedMeshes.push(g);
    });

    // 8. Player Movement State
    const player = {
      x: 0,
      z: -30,
      heading: 0, // In radians
      speed: 0
    };

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (['w', 's', 'arrowup', 'arrowdown'].includes(e.key.toLowerCase())) {
        sounds.playFootstep();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse & Touch 3rd-Person Orbit Controls
    let isMouseDown = false;
    let lastMousePos = { x: 0, y: 0 };
    let cameraOrbitAngle = 0; // Relative horizontal angle in radians
    let cameraPitch = 0.22; // Pitch angle in radians
    let currentCamDistance = 10.5;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      lastMousePos = { x: e.clientX, y: e.clientY };

      cameraOrbitAngle -= dx * 0.006;
      cameraPitch = Math.max(-0.15, Math.min(0.65, cameraPitch + dy * 0.005));
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      currentCamDistance = Math.max(4.5, Math.min(24, currentCamDistance + e.deltaY * 0.015));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Steering & Walking Controls
      const turnSpeed = 2.2;
      if (keys['a'] || keys['arrowleft']) {
        player.heading += turnSpeed * delta;
      }
      if (keys['d'] || keys['arrowright']) {
        player.heading -= turnSpeed * delta;
      }

      const moveSpeed = isSprinting ? 28 : (travelStance === 'GOLDEN_CHARIOT' ? 42 : 12);
      let moving = false;

      if (keys['w'] || keys['arrowup']) {
        player.x += Math.sin(player.heading) * moveSpeed * delta;
        player.z += Math.cos(player.heading) * moveSpeed * delta;
        moving = true;
      }
      if (keys['s'] || keys['arrowdown']) {
        player.x -= Math.sin(player.heading) * (moveSpeed * 0.6) * delta;
        player.z -= Math.cos(player.heading) * (moveSpeed * 0.6) * delta;
        moving = true;
      }

      // Constrain player to Las Vegas Strip road and sidewalks
      player.x = Math.max(-20, Math.min(20, player.x));
      player.z = Math.max(-480, Math.min(480, player.z));

      // Update Player Mesh Position & Rotation
      playerGroup.position.set(player.x, 0, player.z);
      playerGroup.rotation.y = player.heading;

      // Halo Hover Animation
      haloMesh.position.y = 3.2 + Math.sin(time * 4) * 0.12;
      haloMesh.rotation.z = time * 2;

      // Walking Robe Sway
      if (moving) {
        robeMesh.rotation.z = Math.sin(time * 12) * 0.08;
      } else {
        robeMesh.rotation.z = 0;
      }

      // 10. AUTHENTIC 3RD-PERSON GTA CAMERA FOLLOW
      // When moving forward and not dragging, camera smoothly realigns directly behind Jesus
      if (moving && !isMouseDown) {
        cameraOrbitAngle *= 0.94;
      }

      const effectiveHeading = player.heading + cameraOrbitAngle;
      const targetCamX = player.x - Math.sin(effectiveHeading) * (currentCamDistance * Math.cos(cameraPitch));
      const targetCamZ = player.z - Math.cos(effectiveHeading) * (currentCamDistance * Math.cos(cameraPitch));
      const targetCamY = 2.3 + currentCamDistance * Math.sin(cameraPitch);

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.18);
      // Look at Jesus's torso / head level for classic GTA 3rd-person framing
      camera.lookAt(player.x, 2.2, player.z);

      // 11. Animate Traffic Cars
      trafficCars.forEach(car => {
        car.mesh.position.z += car.speed * car.dir;
        if (car.mesh.position.z > 500) car.mesh.position.z = -500;
        if (car.mesh.position.z < -500) car.mesh.position.z = 500;
      });

      // 12. Landmark Animations (The Sphere color pulse)
      sphereMat.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.3;
      sphereMat.color.setHSL((time * 0.05) % 1, 0.8, 0.5);

      // Check proximity to street pedestrians
      let nearbyPed: any = null;
      offlinePeds.forEach((ped, idx) => {
        const dist = playerGroup.position.distanceTo(ped.pos);
        // Spin floating indicator
        pedMeshes[idx].children[1].rotation.y = time * 3;

        if (dist < 15) {
          nearbyPed = ped;
        }
      });

      if (onPedestrianNearby) {
        onPedestrianNearby(nearbyPed);
      }

      // Notify parent of coordinates
      if (onCoordsChange) {
        // Map 3D scene Z (-500 to +500) to Las Vegas Boulevard latitudes (36.14 to 36.08)
        const lat = 36.1162 - (player.z / 1000) * 0.06;
        const lng = -115.1745 + (player.x / 100) * 0.002;
        const headingDeg = ((player.heading * 180) / Math.PI + 360) % 360;
        onCoordsChange({
          lat,
          lng,
          heading: Math.round(headingDeg),
          speedMph: moving ? (isSprinting ? 28 : 12) : 0
        });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isSprinting, travelStance]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none z-0">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* GTA Crosshair Reticle in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/70 shadow-sm shadow-black" />
      </div>
    </div>
  );
};
