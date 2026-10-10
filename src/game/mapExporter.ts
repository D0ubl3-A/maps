import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

export interface Vegas3DExportMetadata {
  projectName: string;
  location: string;
  coordinates: {
    northBound: number;
    southBound: number;
    westBound: number;
    eastBound: number;
    center: { lat: number; lng: number };
  };
  landmarks: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    position3D: [number, number, number];
    description: string;
  }[];
  roads: {
    name: string;
    widthMeters: number;
    lengthMeters: number;
    lanes: number;
  }[];
  character: {
    name: string;
    role: string;
    position: [number, number, number];
  };
  exportedAt: string;
}

/**
 * Builds a complete 3D scene of the Las Vegas Strip for export or offline 3D rendering.
 * Includes Strip asphalt highway, sidewalks, Luxor, Bellagio, Caesars, The Sphere, The STRAT,
 * streetlights, traffic vehicles, and the 3D Jesus avatar.
 */
export function buildVegasStrip3DScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = 'LasVegasStrip_GTA_Jesus_Map';

  // Strip Highway
  const roadWidth = 24;
  const roadLength = 1000;
  const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.1
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.name = 'LasVegasBoulevard_Asphalt';
  roadMesh.rotation.x = -Math.PI / 2;
  scene.add(roadMesh);

  // Center divider lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const centerLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roadLength), lineMat);
  centerLine1.name = 'Road_CenterLine_Yellow1';
  centerLine1.rotation.x = -Math.PI / 2;
  centerLine1.position.set(-0.3, 0.02, 0);
  scene.add(centerLine1);

  const centerLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roadLength), lineMat);
  centerLine2.name = 'Road_CenterLine_Yellow2';
  centerLine2.rotation.x = -Math.PI / 2;
  centerLine2.position.set(0.3, 0.02, 0);
  scene.add(centerLine2);

  // Sidewalks
  const sidewalkWidth = 10;
  const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.3, roadLength);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 });

  const westSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  westSidewalk.name = 'Sidewalk_West_Strip';
  westSidewalk.position.set(-(roadWidth / 2 + sidewalkWidth / 2), 0.15, 0);
  scene.add(westSidewalk);

  const eastSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  eastSidewalk.name = 'Sidewalk_East_Strip';
  eastSidewalk.position.set(roadWidth / 2 + sidewalkWidth / 2, 0.15, 0);
  scene.add(eastSidewalk);

  // 1. THE SPHERE
  const sphereGroup = new THREE.Group();
  sphereGroup.name = 'Landmark_TheSphere';
  sphereGroup.position.set(50, 0, -120);
  const sphereGeo = new THREE.SphereGeometry(28, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.3
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.name = 'TheSphere_ExosphereDome';
  sphereGroup.add(sphereMesh);
  scene.add(sphereGroup);

  // 2. LUXOR PYRAMID & SKY BEAM
  const luxorGroup = new THREE.Group();
  luxorGroup.name = 'Landmark_LuxorPyramid';
  luxorGroup.position.set(-60, 0, 160);
  const pyramidGeo = new THREE.ConeGeometry(38, 45, 4);
  const pyramidMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.8
  });
  const pyramidMesh = new THREE.Mesh(pyramidGeo, pyramidMat);
  pyramidMesh.name = 'Luxor_BlackGlassPyramid';
  pyramidMesh.rotation.y = Math.PI / 4;
  pyramidMesh.position.y = 22.5;
  luxorGroup.add(pyramidMesh);

  const beamGeo = new THREE.CylinderGeometry(1.5, 6, 250, 16);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xe0e7ff,
    transparent: true,
    opacity: 0.6
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.name = 'Luxor_DivineSkyBeam';
  beamMesh.position.y = 150;
  luxorGroup.add(beamMesh);
  scene.add(luxorGroup);

  // 3. BELLAGIO RESORT & FOUNTAIN POOL
  const bellagioGroup = new THREE.Group();
  bellagioGroup.name = 'Landmark_BellagioResort';
  bellagioGroup.position.set(-65, 0, -20);
  const bellagioTower = new THREE.Mesh(
    new THREE.BoxGeometry(60, 65, 25),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  bellagioTower.name = 'Bellagio_MainTower';
  bellagioTower.position.y = 32.5;
  bellagioGroup.add(bellagioTower);

  const poolMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(35, 70),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.5 })
  );
  poolMesh.name = 'Bellagio_FountainLake';
  poolMesh.rotation.x = -Math.PI / 2;
  poolMesh.position.set(30, 0.05, 0);
  bellagioGroup.add(poolMesh);
  scene.add(bellagioGroup);

  // 4. CAESARS PALACE
  const caesarsGroup = new THREE.Group();
  caesarsGroup.name = 'Landmark_CaesarsPalace';
  caesarsGroup.position.set(-60, 0, -90);
  const caesarsBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(45, 55, 30),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
  );
  caesarsBuilding.name = 'Caesars_ColosseumTower';
  caesarsBuilding.position.y = 27.5;
  caesarsGroup.add(caesarsBuilding);
  scene.add(caesarsGroup);

  // 5. THE STRAT TOWER
  const stratGroup = new THREE.Group();
  stratGroup.name = 'Landmark_TheStratTower';
  stratGroup.position.set(55, 0, -350);
  const stratShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 4, 140, 16),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
  );
  stratShaft.position.y = 70;
  stratGroup.add(stratShaft);

  const stratPod = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 14, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.5 })
  );
  stratPod.position.y = 135;
  stratGroup.add(stratPod);

  const stratNeedle = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 45, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
  );
  stratNeedle.position.y = 162.5;
  stratGroup.add(stratNeedle);
  scene.add(stratGroup);

  // 6. CASINO FACADES & NEON BILLBOARDS
  const casinoColors = [0xdb2777, 0x7c3aed, 0x2563eb, 0x059669, 0xd97706];
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) <= 1) continue;
    const zPos = i * 65;

    const h1 = 30 + ((Math.abs(i) * 17) % 35);
    const b1 = new THREE.Mesh(
      new THREE.BoxGeometry(35, h1, 35),
      new THREE.MeshStandardMaterial({
        color: casinoColors[Math.abs(i) % casinoColors.length],
        roughness: 0.6
      })
    );
    b1.name = `CasinoBuilding_East_${i}`;
    b1.position.set(55, h1 / 2, zPos);
    scene.add(b1);

    const h2 = 30 + (((Math.abs(i) + 3) * 13) % 35);
    const b2 = new THREE.Mesh(
      new THREE.BoxGeometry(35, h2, 35),
      new THREE.MeshStandardMaterial({
        color: casinoColors[(Math.abs(i) + 2) % casinoColors.length],
        roughness: 0.6
      })
    );
    b2.name = `CasinoBuilding_West_${i}`;
    b2.position.set(-55, h2 / 2, zPos + 25);
    scene.add(b2);
  }

  // 7. STREETLIGHTS
  for (let z = -450; z <= 450; z += 45) {
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });

    const p1 = new THREE.Mesh(poleGeo, poleMat);
    p1.name = `StreetLamp_East_z${z}`;
    p1.position.set(roadWidth / 2 + 0.5, 3.5, z);
    scene.add(p1);

    const p2 = new THREE.Mesh(poleGeo, poleMat);
    p2.name = `StreetLamp_West_z${z}`;
    p2.position.set(-(roadWidth / 2 + 0.5), 3.5, z);
    scene.add(p2);
  }

  // 8. 3D TRAFFIC CARS
  const carColors = [0xfacc15, 0xef4444, 0x3b82f6, 0x10b981, 0x000000, 0xffffff];
  for (let c = 0; c < 8; c++) {
    const carGroup = new THREE.Group();
    carGroup.name = `TrafficCar_${c}`;
    const color = carColors[c % carColors.length];

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.1, 4.5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
    );
    body.position.y = 0.65;
    carGroup.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.9, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 })
    );
    cabin.position.set(0, 1.45, -0.3);
    carGroup.add(cabin);

    const isNorthbound = c % 2 === 0;
    const laneX = isNorthbound ? -6 : 6;
    carGroup.position.set(laneX, 0, (c - 4) * 80);
    carGroup.rotation.y = isNorthbound ? 0 : Math.PI;
    scene.add(carGroup);
  }

  // 9. 3D JESUS PLAYER CHARACTER WITH HALO
  const playerGroup = new THREE.Group();
  playerGroup.name = 'Player_JesusOfNazareth';
  playerGroup.position.set(0, 0, 0);

  const haloGeo = new THREE.TorusGeometry(0.65, 0.08, 16, 32);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.name = 'Jesus_GoldenHalo';
  haloMesh.rotation.x = Math.PI / 2;
  haloMesh.position.y = 3.2;
  playerGroup.add(haloMesh);

  const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.8 });
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.name = 'Jesus_Head';
  headMesh.position.y = 2.4;
  playerGroup.add(headMesh);

  const robeGeo = new THREE.CylinderGeometry(0.5, 0.85, 2.1, 16);
  const robeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const robeMesh = new THREE.Mesh(robeGeo, robeMat);
  robeMesh.name = 'Jesus_WhiteRobes';
  robeMesh.position.y = 1.15;
  playerGroup.add(robeMesh);

  const sashGeo = new THREE.CylinderGeometry(0.52, 0.86, 2.0, 16, 1, false, 0, Math.PI * 0.8);
  const sashMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.6 });
  const sashMesh = new THREE.Mesh(sashGeo, sashMat);
  sashMesh.name = 'Jesus_CrimsonSash';
  sashMesh.position.y = 1.15;
  playerGroup.add(sashMesh);

  scene.add(playerGroup);

  return scene;
}

/**
 * Downloads a Blob directly to the user's browser with the given filename.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports the 3D scene to glTF 2.0 (.gltf or .glb).
 */
export async function exportSceneToGltf(
  targetScene?: THREE.Scene,
  binary: boolean = false
): Promise<{ success: boolean; filename: string }> {
  const scene = targetScene || buildVegasStrip3DScene();
  const exporter = new GLTFExporter();
  const filename = binary ? 'las-vegas-strip-3d-map.glb' : 'las-vegas-strip-3d-map.gltf';

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        try {
          if (binary) {
            const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
            triggerFileDownload(blob, filename);
          } else {
            const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            const blob = new Blob([output], { type: 'model/gltf+json' });
            triggerFileDownload(blob, filename);
          }
          resolve({ success: true, filename });
        } catch (err) {
          reject(err);
        }
      },
      (error) => {
        console.error('Error exporting GLTF:', error);
        reject(error);
      },
      { binary }
    );
  });
}

/**
 * Exports the 3D scene to Wavefront OBJ format (.obj).
 */
export function exportSceneToObj(targetScene?: THREE.Scene): { success: boolean; filename: string } {
  const scene = targetScene || buildVegasStrip3DScene();
  const exporter = new OBJExporter();
  const result = exporter.parse(scene);
  const filename = 'las-vegas-strip-3d-map.obj';
  const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
  triggerFileDownload(blob, filename);
  return { success: true, filename };
}

/**
 * Exports complete Las Vegas Strip game metadata and GPS coordinates JSON.
 */
export function exportVegasSceneJson(targetScene?: THREE.Scene): { success: boolean; filename: string } {
  const scene = targetScene || buildVegasStrip3DScene();
  const filename = 'las-vegas-strip-game-data.json';

  const metadata: Vegas3DExportMetadata = {
    projectName: 'GTA Jesus: Las Vegas Strip 3D Open World',
    location: 'Las Vegas Boulevard, Nevada, USA',
    coordinates: {
      northBound: 36.1475,
      southBound: 36.0820,
      westBound: -115.1769,
      eastBound: -115.1555,
      center: { lat: 36.1162, lng: -115.1745 }
    },
    landmarks: [
      {
        id: 'the-sphere',
        name: 'The Sphere at Venetian Resort',
        lat: 36.1212,
        lng: -115.1621,
        position3D: [50, 0, -120],
        description: 'World-famous 580,000 sq ft LED Exosphere'
      },
      {
        id: 'luxor-pyramid',
        name: 'Luxor Hotel & Casino Pyramid',
        lat: 36.0955,
        lng: -115.1758,
        position3D: [-60, 0, 160],
        description: 'Black glass pyramid with 42-billion candela vertical sky beam'
      },
      {
        id: 'bellagio-fountains',
        name: 'Bellagio Resort & Fountain Lake',
        lat: 36.1126,
        lng: -115.1767,
        position3D: [-65, 0, -20],
        description: 'Iconic choreographed fountain lake along the Strip sidewalk'
      },
      {
        id: 'caesars-palace',
        name: 'Caesars Palace & Colosseum',
        lat: 36.1162,
        lng: -115.1745,
        position3D: [-60, 0, -90],
        description: 'Roman empire luxury resort with monumental facades'
      },
      {
        id: 'the-strat-tower',
        name: 'The STRAT Hotel, Casino & Tower',
        lat: 36.1475,
        lng: -115.1555,
        position3D: [55, 0, -350],
        description: '1,149 ft observation tower at the North end of Las Vegas Blvd'
      }
    ],
    roads: [
      {
        name: 'Las Vegas Boulevard South (The Strip)',
        widthMeters: 24,
        lengthMeters: 1000,
        lanes: 4
      }
    ],
    character: {
      name: 'Jesus of Nazareth',
      role: 'Open World Protagonist',
      position: [0, 0, 0]
    },
    exportedAt: new Date().toISOString()
  };

  const payload = {
    metadata,
    threeScene: scene.toJSON()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerFileDownload(blob, filename);
  return { success: true, filename };
}
