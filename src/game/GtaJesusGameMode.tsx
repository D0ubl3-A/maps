import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Zap,
  Sparkles,
  Radio,
  Crosshair,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowUp,
  ArrowDown,
  Flame,
  Sun,
  Coins,
  Heart,
  Car,
  Eye,
  UserCheck,
  ShieldAlert,
  Navigation,
  Award,
  Music,
  MessageCircle,
  Footprints,
  Maximize2,
  Download,
  Box,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CityConfig, Landmark, getHaversineDistance } from '../utils';
import { sounds } from './soundEffects';
import { OfflineVegasStrip3D } from './OfflineVegasStrip3D';
import { MapExportModal } from './MapExportModal';

interface GtaJesusGameModeProps {
  city: CityConfig;
  mapElement: any;
  onExitGtaMode: () => void;
  onSelectLandmarkView: (lm: Landmark) => void;
  hasCustomKey?: boolean;
  onDeleteApiKey?: () => void;
}

export type CameraViewMode = 'STREET_3RD_PERSON' | 'STREET_1ST_PERSON' | 'CHARIOT_CRUISER' | 'STRIP_FLYOVER';
export type TravelStance = 'ROBES_WALK' | 'GOLDEN_CHARIOT';

interface StreetPedestrian {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  dialogueBefore: string;
  dialogueAfter: string;
  rewardMoney: number;
  rewardFaith: number;
  isBlessed: boolean;
  avatarIcon: string;
}

interface GtaMission {
  id: string;
  landmarkId: string;
  title: string;
  subtitle: string;
  briefing: string;
  rewardMoney: number;
  rewardFaith: number;
  targetLat: number;
  targetLng: number;
  targetAltitude: number;
  camRange: number;
  camTilt: number;
  camHeading: number;
  miracleEffect: string;
}

const GTA_MISSIONS: GtaMission[] = [
  {
    id: 'mission-bellagio-wine',
    landmarkId: 'bellagio-fountains',
    title: 'THE WATER INTO WINE PROTOCOL',
    subtitle: 'Street Miracle at the Bellagio Fountains',
    briefing: 'Walk along the Bellagio lakeside sidewalk. Cast a street miracle upon the 1,200 shooting fountains and turn the water into sparkling nectar of grace!',
    rewardMoney: 15000,
    rewardFaith: 250,
    targetLat: 36.1126,
    targetLng: -115.1767,
    targetAltitude: 6,
    camRange: 22,
    camTilt: 82,
    camHeading: 85,
    miracleEffect: 'Wine Red Fountain Jets'
  },
  {
    id: 'mission-caesars-buffet',
    landmarkId: 'caesars-palace',
    title: 'FEEDING THE 5,000 HIGH ROLLERS',
    subtitle: 'Loaves & Fishes on the Sidewalks of Caesars',
    briefing: 'Casino crowds outside the Colosseum on Las Vegas Blvd are exhausted. Walk among the tourists and multiply loaves & fishes right on the sidewalk.',
    rewardMoney: 20000,
    rewardFaith: 300,
    targetLat: 36.1162,
    targetLng: -115.1745,
    targetAltitude: 6,
    camRange: 20,
    camTilt: 82,
    camHeading: 110,
    miracleEffect: 'Baskets of Abundance'
  },
  {
    id: 'mission-sphere-halo',
    landmarkId: 'sphere-las-vegas',
    title: 'THE EXOSPHERE REVELATION',
    subtitle: 'Light of the World at Sands & Koval',
    briefing: 'Cruise down Sands Ave directly in front of the 580,000 sq ft LED Exosphere of The Sphere. Project a colossal celestial halo visible across Nevada.',
    rewardMoney: 35000,
    rewardFaith: 500,
    targetLat: 36.1212,
    targetLng: -115.1621,
    targetAltitude: 8,
    camRange: 35,
    camTilt: 80,
    camHeading: 220,
    miracleEffect: 'Celestial 16K Halo'
  },
  {
    id: 'mission-welcome-sign',
    landmarkId: 'welcome-to-las-vegas',
    title: 'VIVA SACRED VEGAS',
    subtitle: 'Gateway Sermon at the 1959 Sign',
    briefing: 'Step up to the iconic 1959 Welcome Sign median on South Las Vegas Blvd. Bestow a permanent blessing over every visitor entering Sin City.',
    rewardMoney: 7777,
    rewardFaith: 100,
    targetLat: 36.0820,
    targetLng: -115.1728,
    targetAltitude: 4,
    camRange: 18,
    camTilt: 84,
    camHeading: 15,
    miracleEffect: 'Golden Neon Glow'
  },
  {
    id: 'mission-luxor-beam',
    landmarkId: 'luxor-pyramid',
    title: 'CLEANSING THE GREAT PYRAMID',
    subtitle: 'Purifying the 42-Billion Candela Sky Beam',
    briefing: 'Walk up the grand sphinx boulevard in front of the Luxor Pyramid. Purify the world-strongest light beam into a beacon of heavenly peace.',
    rewardMoney: 40000,
    rewardFaith: 600,
    targetLat: 36.0955,
    targetLng: -115.1758,
    targetAltitude: 7,
    camRange: 25,
    camTilt: 82,
    camHeading: 45,
    miracleEffect: 'Divine Pillar of Light'
  },
  {
    id: 'mission-strat-ascension',
    landmarkId: 'the-strat-tower',
    title: 'THE STRATOSPHERIC ASCENSION',
    subtitle: 'Blessing from North Strip Tower',
    briefing: 'Stand at the base of the STRAT on Las Vegas Blvd and Sahara. Cast a grand ascension prayer that covers all of the Vegas valley.',
    rewardMoney: 77777,
    rewardFaith: 1000,
    targetLat: 36.1475,
    targetLng: -115.1555,
    targetAltitude: 10,
    camRange: 30,
    camTilt: 80,
    camHeading: 190,
    miracleEffect: 'Ascension Aura'
  }
];

const INITIAL_PEDESTRIANS: StreetPedestrian[] = [
  {
    id: 'ped-marcus',
    name: 'Marcus the Desperate Gambler',
    role: 'Blackjack Table Regular',
    lat: 36.1158,
    lng: -115.1748,
    dialogueBefore: '"Down to my last $10... please God, give me a sign."',
    dialogueAfter: '"I feel this incredible warm peace! I am leaving the tables and calling my kids!"',
    rewardMoney: 1200,
    rewardFaith: 35,
    isBlessed: false,
    avatarIcon: '🎲'
  },
  {
    id: 'ped-roxy',
    name: 'Roxy the Cocktail Waitress',
    role: 'Exhausted Casino Worker',
    lat: 36.1145,
    lng: -115.1755,
    dialogueBefore: '"On hour 14 of my shift carrying heavy trays. My feet are burning..."',
    dialogueAfter: '"The fatigue just melted away! My spirit feels lighter than air!"',
    rewardMoney: 850,
    rewardFaith: 30,
    isBlessed: false,
    avatarIcon: '🍸'
  },
  {
    id: 'ped-elvis',
    name: 'Johnny "The King" Presley',
    role: 'Vegas Elvis Impersonator',
    lat: 36.1172,
    lng: -115.1738,
    dialogueBefore: '"Thank you very much... but deep down inside, I\'m singing the blues."',
    dialogueAfter: '"Hallelujah! The King of Kings has blessed The King! Glory to God!"',
    rewardMoney: 2500,
    rewardFaith: 50,
    isBlessed: false,
    avatarIcon: '🎙️'
  },
  {
    id: 'ped-helena',
    name: 'Helena the Lost Tourist',
    role: 'First-time Vegas Visitor',
    lat: 36.1132,
    lng: -115.1762,
    dialogueBefore: '"My phone battery died and I cannot find my hotel in this blinding neon..."',
    dialogueAfter: '"You showed me the way! Thank you for watching over travelers!"',
    rewardMoney: 777,
    rewardFaith: 25,
    isBlessed: false,
    avatarIcon: '🧳'
  },
  {
    id: 'ped-busker',
    name: 'Big Tommy the Guitarist',
    role: 'Strip Sidewalk Musician',
    lat: 36.1185,
    lng: -115.1729,
    dialogueBefore: '"Playing for loose quarters in the desert heat... strings keep breaking."',
    dialogueAfter: '"My guitar is singing heavenly chords! Best gig of my life!"',
    rewardMoney: 1500,
    rewardFaith: 40,
    isBlessed: false,
    avatarIcon: '🎸'
  },
  {
    id: 'ped-highroller',
    name: 'Vincent "Silk" Corleone',
    role: 'VIP Penthouse Whale',
    lat: 36.1118,
    lng: -115.1769,
    dialogueBefore: '"Money can buy every suite in this town, but it hasn\'t bought me sleep in years."',
    dialogueAfter: '"Take this donation for the needy! Tonight I finally feel clean inside."',
    rewardMoney: 5000,
    rewardFaith: 65,
    isBlessed: false,
    avatarIcon: '💼'
  }
];

const MIRACLES = [
  { id: 'wine', name: 'Water into Wine', icon: '🍷', desc: 'Transforms street fountains into celebratory vintage' },
  { id: 'traffic', name: 'Part the Traffic', icon: '🌊', desc: 'Parts Strip traffic like the Red Sea' },
  { id: 'loaves', name: 'Loaves & Fishes', icon: '🍞', desc: 'Feeds crowds along the sidewalk with fresh bread' },
  { id: 'light', name: 'Divine Illumination', icon: '✨', desc: 'Floods the casino facades with holy neon' },
  { id: 'doves', name: 'Peace Doves', icon: '🕊️', desc: 'Releases glowing white seraph doves across the asphalt' },
  { id: 'heal', name: 'Apostolic Touch', icon: '🤍', desc: 'Radiates health and joy to every soul within 50 yards' }
];

const RADIO_STATIONS = [
  { name: 'K-HOLY 77.7 FM', genre: 'Celestial Synthwave & Gospel Beats', dj: 'DJ Gabriel' },
  { name: 'SIN CITY MIRACLE TALK', genre: 'Live Vegas Street Miracle Reports', dj: 'Vegas Pete' },
  { name: 'DESERT HIGHWAY 104.2', genre: 'Sunset Neon Chariot Funk', dj: 'Sister Maria' },
  { name: 'OFF (MUTE RADIO)', genre: 'Silence', dj: 'None' }
];

export const GtaJesusGameMode: React.FC<GtaJesusGameModeProps> = ({
  city,
  mapElement,
  onExitGtaMode,
  onSelectLandmarkView,
  hasCustomKey = false,
  onDeleteApiKey
}) => {
  // Export Modal & 3D Scene Reference
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const activeOfflineSceneRef = useRef<any>(null);

  // Progression & Economy
  const [cash, setCash] = useState<number>(() => {
    const saved = localStorage.getItem('gta_jesus_cash');
    return saved ? parseInt(saved, 10) : 7777;
  });
  const [faith, setFaith] = useState<number>(100);
  const [grace, setGrace] = useState<number>(100);
  const [stars, setStars] = useState<number>(3); // 1-5 Divine Favor Stars
  const [currentMissionIdx, setCurrentMissionIdx] = useState<number>(0);
  const [selectedMiracleIdx, setSelectedMiracleIdx] = useState<number>(0);
  const [currentRadioIdx, setCurrentRadioIdx] = useState<number>(0);

  // Street Level Gameplay States
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('STREET_3RD_PERSON');
  const [useOfflineEngine, setUseOfflineEngine] = useState<boolean>(() => !mapElement || localStorage.getItem('gta_use_offline_3d') === 'true');
  const [travelStance, setTravelStance] = useState<TravelStance>('ROBES_WALK');
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [walkCycleStep, setWalkCycleStep] = useState<number>(0);
  const [activeStreet, setActiveStreet] = useState<string>('LAS VEGAS BOULEVARD & CAESARS FORUM');

  // Pedestrians / Living City Souls
  const [pedestrians, setPedestrians] = useState<StreetPedestrian[]>(INITIAL_PEDESTRIANS);
  const [nearestPedestrian, setNearestPedestrian] = useState<StreetPedestrian | null>(null);
  const [distanceToNearestPedYds, setDistanceToNearestPedYds] = useState<number>(999);
  const [soulBlessedToast, setSoulBlessedToast] = useState<{
    ped: StreetPedestrian;
    amount: number;
  } | null>(null);

  // Mission State
  const [missionPassedOverlay, setMissionPassedOverlay] = useState<{
    show: boolean;
    title: string;
    money: number;
    faith: number;
  } | null>(null);

  // Active Miracle Trigger animation
  const [miracleBurst, setMiracleBurst] = useState<{
    id: number;
    name: string;
    icon: string;
  } | null>(null);

  // Street Level Coordinates & Telemetry
  // Initial coordinates right on the Las Vegas Strip sidewalk outside Caesars Palace / Bellagio
  const [playerCoords, setPlayerCoords] = useState({
    lat: 36.1162,
    lng: -115.1745,
    altitude: 5,
    heading: 25, // Facing North-East along Las Vegas Blvd
    speedMph: 0
  });

  const currentMission = GTA_MISSIONS[currentMissionIdx % GTA_MISSIONS.length];
  const selectedMiracle = MIRACLES[selectedMiracleIdx];

  // Save cash
  useEffect(() => {
    localStorage.setItem('gta_jesus_cash', cash.toString());
  }, [cash]);

  // ON MOUNT: Fly camera directly down to STREET LEVEL (18m range, 82° tilt, altitude 5m)
  useEffect(() => {
    if (!mapElement) return;

    sounds.playGtaMissionStart();

    try {
      if (typeof mapElement.flyCameraTo === 'function') {
        mapElement.flyCameraTo({
          endCamera: {
            center: { lat: 36.1162, lng: -115.1745, altitude: 5 },
            range: 18,
            tilt: 82,
            heading: 25
          },
          durationMillis: 1800
        });
      }
    } catch (e) {
      console.warn('Initial street camera fly failed', e);
    }
  }, [mapElement]);

  // Camera Settings based on current Camera Mode
  const getCameraParameters = useCallback((mode: CameraViewMode) => {
    switch (mode) {
      case 'STREET_3RD_PERSON':
        return { range: 18, tilt: 82, altitude: 5 };
      case 'STREET_1ST_PERSON':
        return { range: 4, tilt: 85, altitude: 3.5 };
      case 'CHARIOT_CRUISER':
        return { range: 28, tilt: 80, altitude: 5 };
      case 'STRIP_FLYOVER':
        return { range: 160, tilt: 65, altitude: 45 };
    }
  }, []);

  // Update Street name based on current latitude
  const updateStreetName = (lat: number) => {
    let name = 'LAS VEGAS BOULEVARD';
    if (lat > 36.165) name = 'FREMONT STREET EXPERIENCE (DOWNTOWN)';
    else if (lat > 36.142) name = 'LAS VEGAS BLVD & SAHARA AVE (THE STRAT)';
    else if (lat > 36.126) name = 'LAS VEGAS BLVD & DESERT INN RD (WYNN)';
    else if (lat > 36.119) name = 'LAS VEGAS BLVD & SANDS AVE (THE SPHERE)';
    else if (lat > 36.115) name = 'LAS VEGAS BLVD & CAESARS FORUM';
    else if (lat > 36.110) name = 'LAS VEGAS BLVD & FLAMINGO RD (BELLAGIO)';
    else if (lat > 36.102) name = 'LAS VEGAS BLVD & HARMON AVE (COSMOPOLITAN)';
    else if (lat > 36.092) name = 'LAS VEGAS BLVD & TROPICANA AVE (LUXOR)';
    else if (lat < 36.086) name = 'SOUTH STRIP & 1959 WELCOME SIGN';
    setActiveStreet(name);
  };

  // Find nearest street pedestrian
  useEffect(() => {
    let closest: StreetPedestrian | null = null;
    let minDistance = Infinity;

    pedestrians.forEach(p => {
      const distKm = getHaversineDistance(playerCoords.lat, playerCoords.lng, p.lat, p.lng);
      const distYds = distKm * 1093.61;
      if (distYds < minDistance) {
        minDistance = distYds;
        closest = p;
      }
    });

    setNearestPedestrian(closest);
    setDistanceToNearestPedYds(Math.round(minDistance));
  }, [playerCoords.lat, playerCoords.lng, pedestrians]);

  // Steer / Move Player & Camera with Trigonometry Heading at Street Level
  const movePlayerStreet = useCallback((forwardSteps: number, turnHeadingDeg: number) => {
    setPlayerCoords(prev => {
      const newHeading = (prev.heading + turnHeadingDeg + 360) % 360;
      const headingRad = (newHeading * Math.PI) / 180;

      // Base step size for street navigation
      // Forward steps: +1 is forward, -1 is reverse
      const isFast = isSprinting || travelStance === 'GOLDEN_CHARIOT';
      const stepSize = isFast ? 0.00028 : 0.00012; // ~13m on foot, ~30m sprinting
      const speed = isFast ? (travelStance === 'GOLDEN_CHARIOT' ? 65 : 18) : 6;

      const deltaLat = Math.cos(headingRad) * (forwardSteps * stepSize);
      const latRad = (prev.lat * Math.PI) / 180;
      const deltaLng = (Math.sin(headingRad) * (forwardSteps * stepSize)) / Math.max(0.1, Math.cos(latRad));

      const newLat = prev.lat + deltaLat;
      const newLng = prev.lng + deltaLng;

      // Play footstep audio if walking on foot
      if (forwardSteps !== 0) {
        setIsWalking(true);
        setWalkCycleStep(s => (s + 1) % 4);
        if (travelStance === 'ROBES_WALK') {
          sounds.playFootstep();
        }
      }

      updateStreetName(newLat);

      const camParams = getCameraParameters(cameraMode);

      if (mapElement && typeof mapElement.flyCameraTo === 'function') {
        try {
          mapElement.flyCameraTo({
            endCamera: {
              center: { lat: newLat, lng: newLng, altitude: camParams.altitude },
              range: camParams.range,
              tilt: camParams.tilt,
              heading: newHeading
            },
            durationMillis: 240
          });
        } catch (e) {}
      }

      return {
        lat: newLat,
        lng: newLng,
        altitude: camParams.altitude,
        heading: newHeading,
        speedMph: forwardSteps !== 0 ? speed : 0
      };
    });
  }, [isSprinting, travelStance, cameraMode, getCameraParameters, mapElement]);

  // Keyboard navigation for GTA controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          movePlayerStreet(1, 0);
          break;
        case 's':
        case 'arrowdown':
          movePlayerStreet(-0.8, 0);
          break;
        case 'a':
        case 'arrowleft':
          movePlayerStreet(0, -6);
          break;
        case 'd':
        case 'arrowright':
          movePlayerStreet(0, 6);
          break;
        case 'shift':
        case ' ':
          e.preventDefault();
          setIsSprinting(true);
          sounds.playSprintWhoosh();
          movePlayerStreet(1.5, 0);
          break;
        case 'f': // Bless nearest pedestrian
          e.preventDefault();
          blessNearestPedestrian();
          break;
        case 'e': // Perform miracle
          e.preventDefault();
          performMiracle();
          break;
        case 'q': // Switch miracle
          cycleMiracle();
          break;
        case 'c': // Cycle camera mode
          cycleCameraMode();
          break;
        case 'v': // Toggle vehicle / stance
          toggleStance();
          break;
        case 'r': // Radio
          cycleRadio();
          break;
        case 'h': // Horn / Part traffic
          partStreetTraffic();
          break;
        case 'm': // Export 3D Map
          e.preventDefault();
          setShowExportModal(true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'shift' || e.key === ' ') {
        setIsSprinting(false);
      }
      if (['w', 's', 'arrowup', 'arrowdown'].includes(e.key.toLowerCase())) {
        setIsWalking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movePlayerStreet]);

  // Cycle Camera Mode
  const cycleCameraMode = () => {
    sounds.playRadioSwitch();
    const modes: CameraViewMode[] = ['STREET_3RD_PERSON', 'STREET_1ST_PERSON', 'CHARIOT_CRUISER', 'STRIP_FLYOVER'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);

    if (mapElement && typeof mapElement.flyCameraTo === 'function') {
      const params = getCameraParameters(nextMode);
      try {
        mapElement.flyCameraTo({
          endCamera: {
            center: { lat: playerCoords.lat, lng: playerCoords.lng, altitude: params.altitude },
            range: params.range,
            tilt: params.tilt,
            heading: playerCoords.heading
          },
          durationMillis: 600
        });
      } catch (e) {}
    }
  };

  // Toggle Stance (Walking vs Golden Chariot)
  const toggleStance = () => {
    sounds.playBoost();
    setTravelStance(prev => (prev === 'ROBES_WALK' ? 'GOLDEN_CHARIOT' : 'ROBES_WALK'));
  };

  // Cycle Miracle
  const cycleMiracle = () => {
    sounds.playRadioSwitch();
    setSelectedMiracleIdx(prev => (prev + 1) % MIRACLES.length);
  };

  // Cycle Radio
  const cycleRadio = () => {
    sounds.playRadioSwitch();
    setCurrentRadioIdx(prev => (prev + 1) % RADIO_STATIONS.length);
  };

  // Bless Nearest Pedestrian
  const blessNearestPedestrian = () => {
    if (!nearestPedestrian) return;

    if (distanceToNearestPedYds > 45) {
      sounds.playError();
      return;
    }

    if (nearestPedestrian.isBlessed) {
      sounds.playDivineGrace();
      return;
    }

    sounds.playBlessSoul();
    sounds.playCoinDrop();

    // Mark blessed & reward player
    setPedestrians(prev =>
      prev.map(p => (p.id === nearestPedestrian.id ? { ...p, isBlessed: true } : p))
    );

    const donation = nearestPedestrian.rewardMoney;
    setCash(prev => prev + donation);
    setFaith(prev => Math.min(100, prev + nearestPedestrian.rewardFaith));
    setGrace(100);
    setStars(prev => Math.min(5, prev + 1));

    setSoulBlessedToast({
      ped: nearestPedestrian,
      amount: donation
    });

    setTimeout(() => {
      setSoulBlessedToast(null);
    }, 4000);
  };

  // Part Street Traffic / Honk
  const partStreetTraffic = () => {
    sounds.playCarHorn();
    sounds.playDivineGrace();
    setMiracleBurst({
      id: Date.now(),
      name: 'TRAFFIC PARTED (RED SEA WAKE)',
      icon: '🌊'
    });
    setCash(prev => prev + 500);
    setTimeout(() => setMiracleBurst(null), 2500);
  };

  // Trigger Miracle
  const performMiracle = () => {
    sounds.playMiracleCast();
    sounds.playDivineGrace();

    setMiracleBurst({
      id: Date.now(),
      name: selectedMiracle.name,
      icon: selectedMiracle.icon
    });

    setFaith(prev => Math.min(100, prev + 20));
    setStars(prev => Math.min(5, prev + 1));

    setTimeout(() => {
      setMiracleBurst(null);
    }, 2800);
  };

  // Drive/Fly to Mission
  const flyToMission = () => {
    if (!mapElement) return;
    sounds.playBoost();
    try {
      mapElement.flyCameraTo({
        endCamera: {
          center: {
            lat: currentMission.targetLat,
            lng: currentMission.targetLng,
            altitude: currentMission.targetAltitude
          },
          range: currentMission.camRange,
          tilt: currentMission.camTilt,
          heading: currentMission.camHeading
        },
        durationMillis: 2000
      });

      setPlayerCoords({
        lat: currentMission.targetLat,
        lng: currentMission.targetLng,
        altitude: currentMission.targetAltitude,
        heading: currentMission.camHeading,
        speedMph: 45
      });
      updateStreetName(currentMission.targetLat);
    } catch (e) {}
  };

  // Complete Mission ("MISSION PASSED")
  const completeMission = () => {
    sounds.playGtaMissionPassed();
    setCash(prev => prev + currentMission.rewardMoney);
    setFaith(100);
    setGrace(100);
    setStars(5);

    setMissionPassedOverlay({
      show: true,
      title: currentMission.title,
      money: currentMission.rewardMoney,
      faith: currentMission.rewardFaith
    });

    const targetLm = city.landmarks.find(l => l.id === currentMission.landmarkId);
    if (targetLm) {
      onSelectLandmarkView(targetLm);
    }

    setTimeout(() => {
      setMissionPassedOverlay(null);
      setCurrentMissionIdx(prev => prev + 1);
    }, 4500);
  };

  // Distance to mission
  const distanceToTargetKm = getHaversineDistance(
    playerCoords.lat,
    playerCoords.lng,
    currentMission.targetLat,
    currentMission.targetLng
  );
  const distanceYards = Math.round(distanceToTargetKm * 1093.61);

  // Radar bearing
  const relativeBearing = (() => {
    const dLat = currentMission.targetLat - playerCoords.lat;
    const dLng = currentMission.targetLng - playerCoords.lng;
    let targetAngle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    targetAngle = (targetAngle + 360) % 360;
    return (targetAngle - playerCoords.heading + 360) % 360;
  })();

  const isNearPedestrian = nearestPedestrian && distanceToNearestPedYds <= 45;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden font-sans">
      {/* 100% OFFLINE 3D LAS VEGAS STRIP ENGINE (WHEN ACTIVE OR MAPS API UNAVAILABLE) */}
      {useOfflineEngine && (
        <div className="absolute inset-0 pointer-events-auto z-0">
          <OfflineVegasStrip3D
            isSprinting={isSprinting}
            travelStance={travelStance}
            onSceneReady={(scene) => {
              activeOfflineSceneRef.current = scene;
            }}
            onCoordsChange={(coords) => {
              setPlayerCoords({
                lat: coords.lat,
                lng: coords.lng,
                altitude: 5,
                heading: coords.heading,
                speedMph: coords.speedMph
              });
              updateStreetName(coords.lat);
            }}
            onPedestrianNearby={(ped) => {
              if (ped) {
                const found = pedestrians.find(p => p.id === ped.id);
                if (found) {
                  setNearestPedestrian(found);
                  setDistanceToNearestPedYds(12);
                }
              }
            }}
          />
        </div>
      )}

      {/* 3D MAP EXPORT MODAL (.GLTF / .OBJ / .JSON) */}
      <MapExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        scene={activeOfflineSceneRef.current}
        hasCustomKey={hasCustomKey}
        onDeleteApiKey={onDeleteApiKey}
        onSwitchToOfflineEngine={() => {
          setUseOfflineEngine(true);
          localStorage.setItem('gta_use_offline_3d', 'true');
        }}
        isOfflineActive={useOfflineEngine}
      />

      {/* GTA 3RD PERSON CROSSHAIR AIM RETICLE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full border border-white/80 shadow-xs shadow-black flex items-center justify-center">
          <div className="w-0.5 h-0.5 rounded-full bg-white" />
        </div>
      </div>

      {/* FULL SCREEN GTA MISSION PASSED BANNER */}
      <AnimatePresence>
        {missionPassedOverlay?.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto z-50 text-center px-4"
          >
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ rotate: -45, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.08 * i, type: 'spring' }}
                >
                  <Sun className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                </motion.div>
              ))}
            </div>

            <div className="py-4 px-8 rounded-2xl bg-black/85 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex flex-col items-center max-w-lg">
              <h1 className="text-3xl sm:text-5xl font-black text-amber-400 tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                MISSION PASSED!
              </h1>
              <p className="text-base sm:text-xl font-bold text-white tracking-wide mt-1">
                {missionPassedOverlay.title}
              </p>

              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-amber-400/30 text-sm sm:text-base font-extrabold">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <Coins className="w-5 h-5" />
                  <span>+${missionPassedOverlay.money.toLocaleString()}</span>
                </div>
                <div className="text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5" />
                  <span>FAITH +{missionPassedOverlay.faith}</span>
                </div>
                <div className="text-amber-300">
                  <span>RESPECT + 100</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STREET LEVEL INTERACTIVE SOUL BLESSED TOAST */}
      <AnimatePresence>
        {soulBlessedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center text-center max-w-md px-5 py-3 rounded-2xl bg-black/90 border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.7)] backdrop-blur-md"
          >
            <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase">
              <span className="text-2xl">{soulBlessedToast.ped.avatarIcon}</span>
              <span>SOUL BLESSED: {soulBlessedToast.ped.name}</span>
            </div>
            <p className="text-xs text-slate-200 italic mt-1 font-medium">
              {soulBlessedToast.ped.dialogueAfter}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono font-bold text-emerald-400">
              <span>+${soulBlessedToast.amount.toLocaleString()} DONATION</span>
              <span className="text-cyan-300">+35 FAITH</span>
              <span className="text-amber-400">DIVINE GRACE MAX</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MIRACLE ACTIVATION BURST TOAST */}
      <AnimatePresence>
        {miracleBurst && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -40 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/95 via-yellow-400/95 to-amber-500/95 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_30px_rgba(251,191,36,0.6)] border-2 border-white"
          >
            <span className="text-2xl animate-bounce">{miracleBurst.icon}</span>
            <span>MIRACLE CAST: {miracleBurst.name.toUpperCase()}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HUD: Player Jesus Identity, Living Faith/Grace Bars, Wanted Divine Stars & Cash */}
      <header className="absolute top-3 left-3 right-3 sm:left-6 sm:right-6 flex items-start justify-between pointer-events-auto gap-2">
        {/* Top-Left: Player Jesus Card with Halo, Speed, Faith & Grace Gauges */}
        <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-black/85 border border-amber-400/40 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-black text-base shadow-[0_0_12px_rgba(251,191,36,0.6)]">
              <span>✝</span>
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-white tracking-wide">
                  JESUS OF NAZARETH
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[9px] border border-amber-400/30">
                  {travelStance === 'ROBES_WALK' ? 'STREET WALKER' : 'CHARIOT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {playerCoords.speedMph} MPH • {cameraMode.replace('STREET_', '')}
              </span>
            </div>
          </div>

          {/* Faith (Health) & Grace (Armor) Bars */}
          <div className="flex flex-col gap-1 mt-0.5 w-36 sm:w-44">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-emerald-400 w-8">FAITH</span>
              <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden border border-emerald-500/30">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                  style={{ width: `${faith}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-cyan-400 w-8">GRACE</span>
              <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                  style={{ width: `${grace}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Divine Favor Stars (Reverse Wanted Meter) & Camera Switcher */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col items-center p-1.5 px-3 rounded-2xl bg-black/80 border border-amber-400/30 backdrop-blur-md">
            <span className="text-[8.5px] font-extrabold tracking-wider text-amber-300 uppercase">
              DIVINE FAVOR
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map(st => (
                <span
                  key={st}
                  className={`text-xs sm:text-base transition-all ${
                    st <= stars
                      ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'text-slate-600'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Quick Camera Mode & Engine Switcher Pills */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={cycleCameraMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 hover:bg-slate-900 border border-cyan-400/40 text-[10px] text-cyan-300 font-bold tracking-tight shadow-md cursor-pointer transition-all active:scale-95"
              title="Press [C] to toggle Street Views"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Cam: {cameraMode === 'STREET_3RD_PERSON' ? '3rd Person' : cameraMode === 'STREET_1ST_PERSON' ? 'Eye-Level' : cameraMode === 'CHARIOT_CRUISER' ? 'Cruiser' : 'Flyover'} [C]</span>
            </button>

            <button
              onClick={() => {
                const next = !useOfflineEngine;
                setUseOfflineEngine(next);
                localStorage.setItem('gta_use_offline_3d', String(next));
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-tight shadow-md cursor-pointer transition-all active:scale-95 ${
                useOfflineEngine
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                  : 'bg-black/80 hover:bg-slate-900 border-white/20 text-slate-300'
              }`}
              title="Toggle between Live Google Maps 3D and Built-in 100% Offline 3D Engine (No API Key Required)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{useOfflineEngine ? '⚡ Offline 3D (No Key)' : '🌐 Maps 3D'}</span>
            </button>

            {/* Export 3D Map Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[10px] tracking-tight shadow-md shadow-amber-950/70 border border-white/40 cursor-pointer transition-all active:scale-95"
              title="Export 3D Las Vegas Strip Map (.GLTF / .OBJ / .JSON) so you can keep the map forever and delete your API key"
            >
              <Download className="w-3 h-3 text-slate-950 shrink-0" />
              <span>EXPORT 3D MAP [M]</span>
            </button>

            {/* Clean Street Indicator */}
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 border border-emerald-500/40 text-[9.5px] font-bold text-emerald-400"
              title="All commercial business ads, phone numbers, and shop pins are suppressed for clean street gameplay"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>CLEAN STREET (NO ADS)</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Cash, Miracle Slot & Exit Button */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Signature GTA Cash counter */}
          <div className="px-3 py-1 rounded-2xl bg-black/85 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            <span className="text-emerald-400 font-mono font-black text-sm sm:text-xl tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              ${cash.toLocaleString()}
            </span>
          </div>

          {/* Miracle Weapon Box */}
          <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-black/85 border border-amber-400/40 backdrop-blur-md">
            <button
              onClick={cycleMiracle}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-400/60 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-500/30 active:scale-95 transition-all group"
              title="Click or press [Q] to switch Miracle"
            >
              <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">
                {selectedMiracle.icon}
              </span>
              <span className="text-[7.5px] font-black text-amber-300">Q</span>
            </button>

            <div className="flex flex-col">
              <span className="text-[8.5px] text-slate-400 uppercase font-mono">Miracle [E]</span>
              <span className="text-[11px] font-bold text-white max-w-[85px] sm:max-w-[100px] truncate">
                {selectedMiracle.name}
              </span>
              <button
                onClick={performMiracle}
                className="mt-0.5 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase cursor-pointer transition-all active:scale-95"
              >
                Cast
              </button>
            </div>

            <button
              onClick={onExitGtaMode}
              className="p-1 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white cursor-pointer ml-1"
              title="Exit GTA Vegas Mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3RD PERSON STREET AVATAR (JESUS WALKING / DRIVING ON THE VEGAS STRIP) */}
      {!useOfflineEngine && (cameraMode === 'STREET_3RD_PERSON' || cameraMode === 'CHARIOT_CRUISER') && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center select-none">
          {travelStance === 'ROBES_WALK' ? (
            /* Walking / Running Jesus on Street */
            <div className="relative flex flex-col items-center">
              {/* Luminous Pulsing Halo */}
              <div className="relative -mb-1 flex items-center justify-center">
                <div className="w-10 h-2.5 rounded-full border-2 border-amber-300 bg-amber-400/30 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
                <div className="absolute inset-0 bg-yellow-200/50 blur-sm rounded-full" />
              </div>

              {/* Head with beard & flowing hair */}
              <div className="relative w-7 h-7 rounded-full bg-[#f1c27d] border border-amber-800/40 shadow-md flex items-center justify-center overflow-hidden">
                {/* Hair */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-[#4a2e18] rounded-t-full" />
                {/* Beard */}
                <div className="absolute bottom-0 left-1 right-1 h-3.5 bg-[#4a2e18] rounded-b-full" />
              </div>

              {/* Flowing White Robe with Crimson Mantle */}
              <div
                className={`relative w-12 h-14 bg-white border border-slate-300 shadow-xl rounded-t-sm rounded-b-md transition-transform ${
                  isWalking ? (walkCycleStep % 2 === 0 ? 'rotate-1' : '-rotate-1') : ''
                }`}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 70%, #e5e7eb 100%)'
                }}
              >
                {/* Crimson Mantle / Sash draped across shoulder */}
                <div className="absolute top-0 right-0 w-5 h-full bg-rose-700/90 rounded-tr-sm rounded-br-md shadow-inner" />
                {/* Golden Girdle/Belt */}
                <div className="absolute top-6 left-0 right-0 h-1.5 bg-amber-400 border-y border-amber-500" />
              </div>

              {/* Walking Sandals with Street Contact Sparkles */}
              <div className="flex items-center gap-3 -mt-0.5">
                <div
                  className={`w-3.5 h-2 rounded bg-amber-900 border border-amber-700 transition-all ${
                    isWalking && walkCycleStep % 2 === 0 ? '-translate-y-1.5' : 'translate-y-0'
                  }`}
                />
                <div
                  className={`w-3.5 h-2 rounded bg-amber-900 border border-amber-700 transition-all ${
                    isWalking && walkCycleStep % 2 !== 0 ? '-translate-y-1.5' : 'translate-y-0'
                  }`}
                />
              </div>

              {/* Ground Holy Aura touching asphalt */}
              <div className="w-20 h-3 rounded-full bg-amber-400/25 blur-xs -mt-1 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />

              {/* Dynamic Sprint / Dust Particles */}
              {isSprinting && (
                <div className="absolute -bottom-2 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>
          ) : (
            /* Golden Celestial Chariot Cruiser */
            <div className="relative flex flex-col items-center">
              {/* Jesus atop the chariot */}
              <div className="relative flex flex-col items-center -mb-2">
                <div className="w-8 h-2 rounded-full border border-amber-300 bg-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                <div className="w-6 h-6 rounded-full bg-[#f1c27d] border border-amber-900/40" />
                <div className="w-9 h-10 bg-white border border-slate-300 rounded-t-sm">
                  <div className="w-4 h-full bg-rose-700 ml-auto" />
                </div>
              </div>

              {/* Golden Sun Chariot Carriage */}
              <div className="relative w-28 h-12 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 border-2 border-yellow-200 shadow-[0_0_25px_rgba(245,158,11,0.8)] flex items-center justify-between px-2">
                <div className="w-7 h-7 rounded-full border-2 border-yellow-200 bg-black/60 flex items-center justify-center animate-spin">
                  <span className="text-yellow-300 text-xs">☸</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest">
                    APOSTLE
                  </span>
                  <span className="text-[7.5px] font-bold text-amber-950">VEGAS CRUISER</span>
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-yellow-200 bg-black/60 flex items-center justify-center animate-spin">
                  <span className="text-yellow-300 text-xs">☸</span>
                </div>
              </div>

              {/* Asphalt Neon Underglow */}
              <div className="w-32 h-4 rounded-full bg-cyan-400/60 blur-xs -mt-1 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
            </div>
          )}
        </div>
      )}

      {/* STREET-LEVEL PROXIMITY CARD: NEARBY SOUL / PEDESTRIAN INTERACTION */}
      {nearestPedestrian && (
        <div className="absolute top-28 sm:top-24 left-3 sm:left-6 pointer-events-auto max-w-[280px] sm:max-w-xs">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-2.5 sm:p-3 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${
              isNearPedestrian
                ? 'bg-black/90 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : 'bg-black/75 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-cyan-400" />
                <span>STREET SOUL</span>
              </span>
              <span className={`text-[10px] font-mono font-bold ${
                isNearPedestrian ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {distanceToNearestPedYds} YDS
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xl">{nearestPedestrian.avatarIcon}</span>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {nearestPedestrian.name}
                </h3>
                <span className="text-[9.5px] text-amber-300/90 font-medium">
                  {nearestPedestrian.role}
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-300 mt-1 italic line-clamp-2">
              {nearestPedestrian.isBlessed
                ? nearestPedestrian.dialogueAfter
                : nearestPedestrian.dialogueBefore}
            </p>

            {/* Interaction Button */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
              {nearestPedestrian.isBlessed ? (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Blessed & Enlightened</span>
                </div>
              ) : isNearPedestrian ? (
                <button
                  onClick={blessNearestPedestrian}
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 animate-pulse"
                >
                  <Heart className="w-3.5 h-3.5 fill-slate-950" />
                  <span>BLESS SOUL [F] (+${nearestPedestrian.rewardMoney})</span>
                </button>
              ) : (
                <span className="text-[9.5px] text-slate-400 font-mono">
                  Walk closer ({distanceToNearestPedYds} yds) to bless
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* BOTTOM-LEFT: Classic GTA Round GPS Radar Minimap with Street Names */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 flex flex-col items-start gap-1.5 pointer-events-auto">
        <div className="p-2.5 sm:p-3 rounded-3xl bg-black/90 border-2 border-slate-700/80 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          {/* Active Street Ribbon */}
          <div className="w-full text-center pb-1 mb-1 border-b border-white/10 max-w-[130px] sm:max-w-[150px]">
            <span className="font-mono font-black text-[9px] sm:text-[10px] text-amber-400 tracking-wider truncate block">
              {activeStreet}
            </span>
          </div>

          {/* Circular Radar Screen */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-950 border-2 border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/20" />
            <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-cyan-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px bg-cyan-500/20" />
            </div>

            {/* Pedestrians dots on Radar */}
            {pedestrians.map(p => {
              const dLat = p.lat - playerCoords.lat;
              const dLng = p.lng - playerCoords.lng;
              let angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
              const relAngle = (angle - playerCoords.heading + 360) % 360;
              const dist = Math.min(45, Math.hypot(dLat, dLng) * 4000);

              return (
                <div
                  key={p.id}
                  className="absolute w-2 h-2 rounded-full transition-transform"
                  style={{
                    backgroundColor: p.isBlessed ? '#10b981' : '#f59e0b',
                    transform: `rotate(${relAngle}deg) translate(0, -${dist}px)`
                  }}
                  title={p.name}
                />
              );
            })}

            {/* Center Player Jesus Indicator */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-3.5 h-1 rounded-full bg-amber-300 animate-pulse shadow-[0_0_8px_rgba(251,191,36,1)]" />
              <Navigation className="w-4 h-4 text-amber-400 fill-amber-400 -mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,1)]" />
            </div>

            {/* Target Mission Objective Marker [J] */}
            <div
              className="absolute w-4 h-4 flex items-center justify-center transition-all duration-300"
              style={{
                transform: `rotate(${relativeBearing}deg) translate(0, -42px) rotate(-${relativeBearing}deg)`
              }}
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] shadow-[0_0_12px_rgba(251,191,36,1)] border border-white">
                J
              </div>
            </div>
          </div>

          {/* Distance to current mission marker */}
          <div className="flex items-center justify-between w-full mt-1.5 text-[9px] text-slate-300 font-mono">
            <span>MISSION</span>
            <span className="font-bold text-amber-400">{distanceYards} YDS</span>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Radio Station & Quick Street Action Buttons */}
      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 pointer-events-auto flex flex-col items-end gap-2">
        {/* GTA Radio Dial */}
        <div className="p-2 px-3 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2.5">
          <button
            onClick={cycleRadio}
            className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 cursor-pointer active:scale-95 transition-all"
            title="Press [R] to change radio station"
          >
            <Radio className="w-4 h-4 animate-pulse" />
          </button>
          <div className="flex flex-col">
            <span className="text-[8.5px] text-slate-400 font-mono">RADIO [R]</span>
            <span className="text-[11px] font-bold text-white tracking-wide">
              {RADIO_STATIONS[currentRadioIdx].name}
            </span>
            <span className="text-[8.5px] text-cyan-300 font-mono truncate max-w-[110px]">
              {RADIO_STATIONS[currentRadioIdx].genre}
            </span>
          </div>
        </div>

        {/* Quick Stance & Street Action Buttons */}
        <div className="flex items-center gap-1.5 bg-black/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          {/* Stance Toggle: Walk vs Chariot */}
          <button
            onClick={toggleStance}
            className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              travelStance === 'GOLDEN_CHARIOT'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Press [V] to toggle Walking Robes vs Golden Chariot"
          >
            {travelStance === 'GOLDEN_CHARIOT' ? <Car className="w-3 h-3" /> : <Footprints className="w-3 h-3" />}
            <span>{travelStance === 'GOLDEN_CHARIOT' ? 'Chariot [V]' : 'Walk [V]'}</span>
          </button>

          {/* Part Street Traffic */}
          <button
            onClick={partStreetTraffic}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Press [H] to part street traffic"
          >
            <Zap className="w-3 h-3" />
            <span>Part Traffic [H]</span>
          </button>
        </div>
      </div>

      {/* BOTTOM-CENTER: Current GTA Storyline Mission Deck */}
      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 w-[460px] max-w-[95vw] pointer-events-auto">
        <div className="p-3 rounded-3xl bg-black/90 border-2 border-amber-400/50 backdrop-blur-xl shadow-2xl flex flex-col gap-2">
          {/* Mission Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 font-black text-xs">
                {currentMissionIdx + 1}
              </div>
              <div>
                <h2 className="font-black text-xs text-amber-400 tracking-wide uppercase">
                  {currentMission.title}
                </h2>
                <span className="text-[9.5px] text-slate-300 font-medium">
                  {currentMission.subtitle}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8.5px] text-slate-400 font-mono">REWARD</span>
              <div className="font-mono font-black text-xs text-emerald-400">
                +${currentMission.rewardMoney.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Mission Briefing */}
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic line-clamp-2">
            "{currentMission.briefing}"
          </p>

          {/* Mission Action Buttons */}
          <div className="flex items-center gap-2 pt-0.5 border-t border-white/10">
            <button
              onClick={flyToMission}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Walk / Drive to Target</span>
            </button>

            <button
              onClick={completeMission}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/60 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pass Mission & Miracle</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / ON-SCREEN VIRTUAL JOYSTICK & TOUCH CONTROLS */}
      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] pointer-events-auto flex items-center justify-between gap-2">
        {/* Left: Directional D-Pad / Steering */}
        <div className="flex flex-col items-center gap-1 bg-black/85 p-2 rounded-2xl border border-amber-400/40 backdrop-blur-md">
          <button
            onClick={() => movePlayerStreet(1, 0)}
            className="w-10 h-9 rounded-xl bg-white/15 active:bg-amber-500/40 flex items-center justify-center text-white"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => movePlayerStreet(0, -6)}
              className="w-10 h-9 rounded-xl bg-white/15 active:bg-amber-500/40 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsSprinting(prev => !prev);
                sounds.playSprintWhoosh();
              }}
              className={`w-10 h-9 rounded-xl flex items-center justify-center text-slate-950 font-black text-xs ${
                isSprinting ? 'bg-amber-400' : 'bg-white/20 text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={() => movePlayerStreet(0, 6)}
              className="w-10 h-9 rounded-xl bg-white/15 active:bg-amber-500/40 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => movePlayerStreet(-1, 0)}
            className="w-10 h-9 rounded-xl bg-white/15 active:bg-amber-500/40 flex items-center justify-center text-white"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Touch Street Actions (Bless, Miracle, Cam) */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Bless Button if near */}
          {isNearPedestrian && !nearestPedestrian?.isBlessed && (
            <button
              onClick={blessNearestPedestrian}
              className="py-2 px-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg animate-pulse"
            >
              <Heart className="w-4 h-4 fill-slate-950" />
              <span>BLESS SOUL</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-black/85 p-1.5 rounded-2xl border border-amber-400/40 backdrop-blur-md">
            <button
              onClick={performMiracle}
              className="w-10 h-10 rounded-xl bg-amber-500 active:bg-amber-400 flex items-center justify-center text-slate-950 font-black text-lg"
              title="Cast Miracle"
            >
              {selectedMiracle.icon}
            </button>
            <button
              onClick={cycleCameraMode}
              className="w-10 h-10 rounded-xl bg-white/15 active:bg-cyan-500/40 flex items-center justify-center text-cyan-300"
              title="Cycle Camera"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={toggleStance}
              className="w-10 h-10 rounded-xl bg-white/15 active:bg-amber-500/40 flex items-center justify-center text-amber-300"
              title="Toggle Walk / Chariot"
            >
              {travelStance === 'GOLDEN_CHARIOT' ? <Car className="w-4 h-4" /> : <Footprints className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 active:scale-95 flex items-center justify-center text-slate-950 font-black shadow-md"
              title="Export 3D Map"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
