import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Trophy,
  Target,
  Zap,
  HelpCircle,
  Volume2,
  VolumeX,
  Gauge,
  Navigation2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Sparkles,
  Award,
  Crosshair,
  CheckCircle2,
  Flame,
  Radio,
  Sliders,
  Play,
  Pause,
  MapPin,
  X,
  ArrowUp,
  ArrowDown,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CityConfig, Landmark, getHaversineDistance } from '../utils';
import { GameMode, GameHudTheme, PlayerStats, CheckpointGate, CityQuestObjective, GeoGuessrQuestion } from './gameTypes';
import { getCityQuests, getCityCheckpoints, getCityGeoQuestions, calculateRank } from './cityQuests';
import { sounds } from './soundEffects';

interface GameMapOverlayProps {
  city: CityConfig;
  mapElement: any;
  onExitGameMode: () => void;
  onSelectLandmarkView: (lm: Landmark) => void;
  isDarkTheme?: boolean;
}

export const GameMapOverlay: React.FC<GameMapOverlayProps> = ({
  city,
  mapElement,
  onExitGameMode,
  onSelectLandmarkView,
}) => {
  // Game Modes
  const [gameMode, setGameMode] = useState<GameMode>('FLIGHT_RUSH');
  const [hudTheme, setHudTheme] = useState<GameHudTheme>('CYBERPUNK');
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);

  // Player Progression State
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('city_game_map_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      score: 0,
      coinsCollected: 0,
      checkpointsCleared: 0,
      guessrStreak: 0,
      bestStreak: 0,
      discoveredLandmarkIds: [],
      totalFlightDistanceKm: 0,
      rankTitle: 'Ground Scout',
      level: 1,
      xp: 0
    };
  });

  // Save stats
  useEffect(() => {
    localStorage.setItem('city_game_map_stats', JSON.stringify(stats));
  }, [stats]);

  // Telemetry state (camera real-time data)
  const [camTelemetry, setCamTelemetry] = useState({
    heading: 0,
    tilt: 45,
    range: 1200,
    altitude: 120,
    speedKmh: 65,
    lat: city.initialCam.center.lat,
    lng: city.initialCam.center.lng
  });

  // Current Quest data
  const [quests, setQuests] = useState<CityQuestObjective[]>(() => getCityQuests(city));
  const [currentQuestIdx, setCurrentQuestIdx] = useState<number>(0);
  const [questHintRevealed, setQuestHintRevealed] = useState<boolean>(false);
  const [questCompletedPopup, setQuestCompletedPopup] = useState<string | null>(null);

  // Flight Rush Checkpoints data
  const [checkpoints, setCheckpoints] = useState<CheckpointGate[]>(() => getCityCheckpoints(city));
  const [currentGateIdx, setCurrentGateIdx] = useState<number>(0);
  const [courseTimer, setCourseTimer] = useState<number>(60);
  const [courseRunning, setCourseRunning] = useState<boolean>(false);
  const [courseFinished, setCourseFinished] = useState<boolean>(false);
  const [lastSplitTime, setLastSplitTime] = useState<string | null>(null);

  // GeoGuessr Questions data
  const [geoQuestions, setGeoQuestions] = useState<GeoGuessrQuestion[]>(() => getCityGeoQuestions(city));
  const [guessrIdx, setGuessrIdx] = useState<number>(0);
  const [guessrSelectedId, setGuessrSelectedId] = useState<string | null>(null);
  const [guessrResult, setGuessrResult] = useState<'CORRECT' | 'WRONG' | null>(null);

  // Floating XP toast
  const [xpToasts, setXpToasts] = useState<{ id: number; text: string }[]>([]);

  const addXpToast = (text: string) => {
    const id = Date.now() + Math.random();
    setXpToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setXpToasts(prev => prev.filter(t => t.id !== id));
    }, 1800);
  };

  const awardPoints = (points: number, reason: string) => {
    setStats(prev => {
      const newXp = prev.xp + points;
      const rank = calculateRank(newXp);
      const isLevelUp = rank.level > prev.level;
      if (isLevelUp) {
        sounds.playLevelUp();
        addXpToast(`LEVEL UP! ${rank.title} (Lv. ${rank.level})`);
      } else {
        addXpToast(`+${points} XP: ${reason}`);
      }
      return {
        ...prev,
        score: prev.score + points,
        xp: newXp,
        level: rank.level,
        rankTitle: rank.title
      };
    });
  };

  // Re-seed data on city change
  useEffect(() => {
    setQuests(getCityQuests(city));
    setCheckpoints(getCityCheckpoints(city));
    setGeoQuestions(getCityGeoQuestions(city));
    setCurrentQuestIdx(0);
    setCurrentGateIdx(0);
    setGuessrIdx(0);
    setCourseRunning(false);
    setCourseFinished(false);
    setCourseTimer(60);
  }, [city.id]);

  // Telemetry loop querying mapElement
  useEffect(() => {
    const interval = setInterval(() => {
      if (mapElement) {
        try {
          const center = mapElement.center;
          const heading = Math.round(mapElement.heading || 0);
          const tilt = Math.round(mapElement.tilt || 0);
          const range = Math.round(mapElement.range || 0);
          const lat = center?.lat || city.initialCam.center.lat;
          const lng = center?.lng || city.initialCam.center.lng;
          const altitude = Math.round(center?.altitude || 80);

          setCamTelemetry(prev => ({
            ...prev,
            heading: (heading % 360 + 360) % 360,
            tilt,
            range,
            altitude,
            lat,
            lng,
            speedKmh: isBoostActive ? 180 : (courseRunning ? 120 : 65)
          }));
        } catch (e) {}
      }
    }, 200);

    return () => clearInterval(interval);
  }, [mapElement, isBoostActive, courseRunning, city]);

  // Calculate distance to current target
  const currentTargetLandmark = useCallback(() => {
    if (gameMode === 'QUEST') {
      const q = quests[currentQuestIdx];
      if (!q) return null;
      return city.landmarks.find(l => l.id === q.landmarkId) || null;
    }
    if (gameMode === 'FLIGHT_RUSH') {
      const g = checkpoints[currentGateIdx];
      if (!g) return null;
      return { lat: g.lat, lng: g.lng, name: g.name };
    }
    return null;
  }, [gameMode, currentQuestIdx, currentGateIdx, quests, checkpoints, city.landmarks]);

  const targetDistKm = (() => {
    const target = currentTargetLandmark();
    if (!target) return 0;
    return getHaversineDistance(camTelemetry.lat, camTelemetry.lng, target.lat, target.lng);
  })();

  const targetDistMeters = Math.round(targetDistKm * 1000);

  // Directional bearing from camera to target (relative to heading)
  const relativeBearing = (() => {
    const target = currentTargetLandmark();
    if (!target) return 0;
    const dLat = target.lat - camTelemetry.lat;
    const dLng = target.lng - camTelemetry.lng;
    let targetAngle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    targetAngle = (targetAngle + 360) % 360;
    const rel = (targetAngle - camTelemetry.heading + 360) % 360;
    return rel;
  })();

  // Course timer ticker
  useEffect(() => {
    if (!courseRunning || courseFinished) return;
    const timer = setInterval(() => {
      setCourseTimer(prev => {
        if (prev <= 1) {
          setCourseRunning(false);
          sounds.playError();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [courseRunning, courseFinished]);

  // Fly / Steer camera in 3D
  const steerCamera = (deltaLat: number, deltaLng: number, deltaHeading: number, deltaTilt: number, deltaRange: number) => {
    if (!mapElement) return;

    try {
      const curCenter = mapElement.center || { lat: camTelemetry.lat, lng: camTelemetry.lng, altitude: 50 };
      const curHeading = (mapElement.heading || 0) + deltaHeading;
      const curTilt = Math.max(10, Math.min(85, (mapElement.tilt || 45) + deltaTilt));
      const curRange = Math.max(150, Math.min(8000, (mapElement.range || 800) + deltaRange));

      const newLat = curCenter.lat + deltaLat;
      const newLng = curCenter.lng + deltaLng;

      if (typeof mapElement.flyCameraTo === 'function') {
        mapElement.flyCameraTo({
          endCamera: {
            center: { lat: newLat, lng: newLng, altitude: curCenter.altitude || 50 },
            range: curRange,
            tilt: curTilt,
            heading: (curHeading + 360) % 360
          },
          durationMillis: 600
        });
      } else {
        mapElement.center = { lat: newLat, lng: newLng, altitude: curCenter.altitude || 50 };
        mapElement.heading = curHeading;
      }
    } catch (e) {
      console.warn("Camera steer failed", e);
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const step = isBoostActive ? 0.0035 : 0.0018;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          steerCamera(step, 0, 0, 0, 0);
          break;
        case 's':
        case 'arrowdown':
          steerCamera(-step, 0, 0, 0, 0);
          break;
        case 'a':
        case 'arrowleft':
          steerCamera(0, -step, 0, 0, 0);
          break;
        case 'd':
        case 'arrowright':
          steerCamera(0, step, 0, 0, 0);
          break;
        case 'q':
          steerCamera(0, 0, -18, 0, 0);
          break;
        case 'e':
          steerCamera(0, 0, 18, 0, 0);
          break;
        case 'r':
          steerCamera(0, 0, 0, -10, -120);
          break;
        case 'f':
          steerCamera(0, 0, 0, 10, 120);
          break;
        case ' ': // Space = Boost
          e.preventDefault();
          setIsBoostActive(true);
          sounds.playBoost();
          steerCamera(step * 2, 0, 0, 0, -100);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsBoostActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mapElement, isBoostActive]);

  // Fly direct to checkpoint / gate
  const flyToCurrentGate = () => {
    const gate = checkpoints[currentGateIdx];
    if (!gate || !mapElement) return;

    sounds.playBoost();
    try {
      mapElement.flyCameraTo({
        endCamera: {
          center: { lat: gate.lat, lng: gate.lng, altitude: gate.altitude },
          range: gate.range,
          tilt: gate.tilt,
          heading: gate.heading
        },
        durationMillis: 1800
      });
    } catch (e) {}
  };

  // Claim Checkpoint Gate
  const handlePassCheckpoint = () => {
    const gate = checkpoints[currentGateIdx];
    if (!gate) return;

    sounds.playCheckpoint();
    awardPoints(gate.bonusPoints, `Cleared ${gate.name}!`);
    setStats(prev => ({
      ...prev,
      checkpointsCleared: prev.checkpointsCleared + 1,
      totalFlightDistanceKm: prev.totalFlightDistanceKm + 1.2
    }));

    // Add time bonus
    setCourseTimer(prev => prev + 12);
    setLastSplitTime(`+12s BONUS (${gate.name})`);

    if (currentGateIdx + 1 < checkpoints.length) {
      setCurrentGateIdx(prev => prev + 1);
      // Auto swoop to next gate
      const nextGate = checkpoints[currentGateIdx + 1];
      if (nextGate && mapElement) {
        setTimeout(() => {
          mapElement.flyCameraTo({
            endCamera: {
              center: { lat: nextGate.lat, lng: nextGate.lng, altitude: nextGate.altitude },
              range: nextGate.range,
              tilt: nextGate.tilt,
              heading: nextGate.heading
            },
            durationMillis: 2000
          });
        }, 300);
      }
    } else {
      // Course completed!
      sounds.playVictoryFanfare();
      setCourseFinished(true);
      setCourseRunning(false);
      awardPoints(1000, `FLIGHT COURSE COMPLETED IN ${city.name}!`);
    }
  };

  // Start / Restart flight rush
  const startFlightRushCourse = () => {
    setCurrentGateIdx(0);
    setCourseTimer(75);
    setCourseFinished(false);
    setCourseRunning(true);
    sounds.playRadarPing();
    flyToCurrentGate();
  };

  // Scavenger Quest Claim
  const handleClaimQuestLandmark = () => {
    const quest = quests[currentQuestIdx];
    if (!quest) return;

    sounds.playCoinCollect();
    awardPoints(quest.points, `Located ${quest.title}`);
    setStats(prev => ({
      ...prev,
      coinsCollected: prev.coinsCollected + 1,
      discoveredLandmarkIds: Array.from(new Set([...prev.discoveredLandmarkIds, quest.landmarkId]))
    }));

    setQuestCompletedPopup(`TARGET IDENTIFIED: ${quest.title}!`);
    setTimeout(() => setQuestCompletedPopup(null), 3000);

    const lm = city.landmarks.find(l => l.id === quest.landmarkId);
    if (lm) {
      onSelectLandmarkView(lm);
    }

    if (currentQuestIdx + 1 < quests.length) {
      setCurrentQuestIdx(prev => prev + 1);
      setQuestHintRevealed(false);
    } else {
      sounds.playVictoryFanfare();
      awardPoints(1500, `ALL LANDMARKS FOUND IN ${city.name}!`);
    }
  };

  // GeoGuessr challenge fly-to
  const startGeoGuessrDrop = (qIdx: number) => {
    const q = geoQuestions[qIdx];
    if (!q || !mapElement) return;

    setGuessrSelectedId(null);
    setGuessrResult(null);

    const correctLm = city.landmarks.find(l => l.id === q.correctLandmarkId);
    if (!correctLm) return;

    sounds.playRadarPing();
    try {
      mapElement.flyCameraTo({
        endCamera: {
          center: {
            lat: correctLm.lat + q.camOffset.latOffset,
            lng: correctLm.lng + q.camOffset.lngOffset,
            altitude: q.camOffset.altitude
          },
          range: q.camOffset.range,
          tilt: q.camOffset.tilt,
          heading: q.camOffset.heading
        },
        durationMillis: 2200
      });
    } catch (e) {}
  };

  // GeoGuessr answer submission
  const handleGuessrAnswer = (chosenId: string) => {
    if (guessrResult !== null) return;
    const q = geoQuestions[guessrIdx];
    if (!q) return;

    setGuessrSelectedId(chosenId);
    if (chosenId === q.correctLandmarkId) {
      sounds.playVictoryFanfare();
      setGuessrResult('CORRECT');
      const streak = stats.guessrStreak + 1;
      const pts = 250 + streak * 50;
      awardPoints(pts, `Mystery Solved! (${streak}x Streak)`);
      setStats(prev => ({
        ...prev,
        guessrStreak: streak,
        bestStreak: Math.max(prev.bestStreak, streak)
      }));

      // Fly to hero angle
      const lm = city.landmarks.find(l => l.id === chosenId);
      if (lm) {
        onSelectLandmarkView(lm);
      }
    } else {
      sounds.playError();
      setGuessrResult('WRONG');
      setStats(prev => ({
        ...prev,
        guessrStreak: 0
      }));
    }
  };

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (hudTheme) {
      case 'CYBERPUNK':
        return {
          panel: 'bg-black/85 border-cyan-500/40 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.18)]',
          accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-400/50',
          badge: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40',
          radarBorder: 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          radarSweep: 'from-cyan-500/25',
          font: 'font-mono'
        };
      case 'AVIATION':
        return {
          panel: 'bg-slate-950/90 border-emerald-500/40 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.18)]',
          accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/50',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          radarBorder: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          radarSweep: 'from-emerald-500/25',
          font: 'font-mono'
        };
      case 'TACTICAL':
        return {
          panel: 'bg-zinc-950/90 border-amber-500/40 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.18)]',
          accent: 'text-amber-400 bg-amber-500/20 border-amber-400/50',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          radarBorder: 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          radarSweep: 'from-amber-500/25',
          font: 'font-mono'
        };
      case 'ARCADE':
        return {
          panel: 'bg-indigo-950/90 border-violet-500/50 text-indigo-300 shadow-[0_0_25px_rgba(139,92,246,0.2)]',
          accent: 'text-yellow-300 bg-violet-500/30 border-yellow-400/50',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
          radarBorder: 'border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
          radarSweep: 'from-indigo-500/25',
          font: 'font-sans'
        };
    }
  };

  const themeStyle = getThemeClasses();

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* XP Floating Toasts */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {xpToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/30 border border-yellow-200"
            >
              ★ {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Crosshair / Targeting Reticle in Viewport Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400/80" />
          <div className="absolute w-12 h-12 rounded-full border border-dashed border-cyan-400/60" />
          <div className="absolute top-0 w-0.5 h-3 bg-cyan-400" />
          <div className="absolute bottom-0 w-0.5 h-3 bg-cyan-400" />
          <div className="absolute left-0 h-0.5 w-3 bg-cyan-400" />
          <div className="absolute right-0 h-0.5 w-3 bg-cyan-400" />
        </div>
      </div>

      {/* TOP GAME BAR: Score, Level, Mode Switcher, Audio & Exit buttons */}
      <header className="absolute top-2 left-2 right-2 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: Player Profile & Level */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-md ${themeStyle.panel}`}>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-extrabold text-xs sm:text-sm tracking-wide text-white">
              {stats.score.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 w-px bg-white/20" />
          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-slate-400">Lv.{stats.level}</span>
            <span className="hidden sm:inline font-semibold text-cyan-300 truncate max-w-[110px]">
              {stats.rankTitle}
            </span>
          </div>
        </div>

        {/* Center: Game Mode Tabs */}
        <div className={`hidden md:flex items-center p-1 rounded-2xl border backdrop-blur-md gap-1 ${themeStyle.panel}`}>
          <button
            onClick={() => {
              setGameMode('FLIGHT_RUSH');
              sounds.playRadarPing();
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              gameMode === 'FLIGHT_RUSH'
                ? themeStyle.accent
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Flight Checkpoints</span>
          </button>

          <button
            onClick={() => {
              setGameMode('QUEST');
              sounds.playRadarPing();
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              gameMode === 'QUEST'
                ? themeStyle.accent
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Scavenger Quest</span>
          </button>

          <button
            onClick={() => {
              setGameMode('GEOGUESSR');
              sounds.playRadarPing();
              startGeoGuessrDrop(guessrIdx);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              gameMode === 'GEOGUESSR'
                ? themeStyle.accent
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Geo Mystery</span>
          </button>

          <button
            onClick={() => {
              setGameMode('FREE_ROAM');
              sounds.playRadarPing();
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              gameMode === 'FREE_ROAM'
                ? themeStyle.accent
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Free Flight</span>
          </button>
        </div>

        {/* Right: Audio, HUD Style, Guide, Exit Game Mode */}
        <div className="flex items-center gap-1.5">
          {/* Mute/Unmute */}
          <button
            onClick={() => {
              const nextMute = !isMuted;
              sounds.setMuted(nextMute);
              setIsMuted(nextMute);
            }}
            className={`w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${themeStyle.panel} hover:text-white`}
            title={isMuted ? "Unmute Game Audio" : "Mute Game Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => {
              const themes: GameHudTheme[] = ['CYBERPUNK', 'AVIATION', 'TACTICAL', 'ARCADE'];
              const next = themes[(themes.indexOf(hudTheme) + 1) % themes.length];
              setHudTheme(next);
              sounds.playRadarPing();
            }}
            className={`w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${themeStyle.panel} hover:text-white`}
            title={`HUD Theme: ${hudTheme}`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Controls Guide */}
          <button
            onClick={() => setShowControlsGuide(!showControlsGuide)}
            className={`w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${themeStyle.panel} hover:text-white`}
            title="Controls & Hotkeys"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Return to Cinematic Tour Mode */}
          <button
            onClick={onExitGameMode}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-tight shadow-lg shadow-rose-950/50 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Exit Game Mode back to Immersive Tour"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Game</span>
          </button>
        </div>
      </header>

      {/* MOBILE MODE SELECTOR (for small screens) */}
      <div className="md:hidden absolute top-14 left-2 right-2 flex items-center justify-center pointer-events-auto">
        <div className={`flex items-center p-1 rounded-xl border backdrop-blur-md gap-1 ${themeStyle.panel}`}>
          <button
            onClick={() => setGameMode('FLIGHT_RUSH')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              gameMode === 'FLIGHT_RUSH' ? themeStyle.accent : 'text-slate-400'
            }`}
          >
            Rush
          </button>
          <button
            onClick={() => setGameMode('QUEST')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              gameMode === 'QUEST' ? themeStyle.accent : 'text-slate-400'
            }`}
          >
            Quest
          </button>
          <button
            onClick={() => {
              setGameMode('GEOGUESSR');
              startGeoGuessrDrop(guessrIdx);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              gameMode === 'GEOGUESSR' ? themeStyle.accent : 'text-slate-400'
            }`}
          >
            Mystery
          </button>
          <button
            onClick={() => setGameMode('FREE_ROAM')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              gameMode === 'FREE_ROAM' ? themeStyle.accent : 'text-slate-400'
            }`}
          >
            Free
          </button>
        </div>
      </div>

      {/* LEFT HUD: Tactical Telemetry & Speed Tape */}
      <div className="absolute left-2 sm:left-4 top-24 sm:top-20 flex flex-col gap-2 pointer-events-auto">
        <div className={`p-3 rounded-2xl border backdrop-blur-md flex flex-col gap-2 w-32 sm:w-36 ${themeStyle.panel}`}>
          <div className="flex items-center justify-between text-[10px] border-b border-white/10 pb-1 text-slate-400">
            <span className="font-bold flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              FLIGHT HUD
            </span>
            <span className="text-emerald-400 animate-pulse">● LIVE</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Airspeed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                {camTelemetry.speedKmh}
              </span>
              <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Altitude</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                {camTelemetry.altitude}
              </span>
              <span className="text-[10px] text-slate-400">m AGL</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Heading</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black tracking-tight text-white">
                {camTelemetry.heading.toString().padStart(3, '0')}°
              </span>
              <span className="text-[10px] text-cyan-400">
                {camTelemetry.heading >= 337.5 || camTelemetry.heading < 22.5 ? 'N' :
                 camTelemetry.heading < 67.5 ? 'NE' :
                 camTelemetry.heading < 112.5 ? 'E' :
                 camTelemetry.heading < 157.5 ? 'SE' :
                 camTelemetry.heading < 202.5 ? 'S' :
                 camTelemetry.heading < 247.5 ? 'SW' :
                 camTelemetry.heading < 292.5 ? 'W' : 'NW'}
              </span>
            </div>
          </div>

          {isBoostActive && (
            <div className="py-0.5 px-1.5 rounded bg-rose-600/80 text-white font-black text-[9px] text-center tracking-wider animate-pulse border border-rose-400">
              ⚡ AFTERBURNER
            </div>
          )}
        </div>
      </div>

      {/* RIGHT HUD: Tactical Minimap Radar */}
      <div className="absolute right-2 sm:right-4 top-24 sm:top-20 flex flex-col gap-2 pointer-events-auto">
        <div className={`p-3 rounded-2xl border backdrop-blur-md flex flex-col items-center gap-2 w-36 sm:w-44 ${themeStyle.panel}`}>
          <div className="flex items-center justify-between w-full text-[10px] border-b border-white/10 pb-1 text-slate-400">
            <span className="font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              RADAR
            </span>
            <button
              onClick={() => sounds.playRadarPing()}
              className="text-[9px] text-cyan-400 hover:text-white cursor-pointer"
            >
              PING
            </button>
          </div>

          {/* Circular Radar Screen */}
          <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 bg-black/60 overflow-hidden flex items-center justify-center ${themeStyle.radarBorder}`}>
            {/* Concentric distance rings */}
            <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-10 rounded-full border border-cyan-500/20" />
            {/* Radar crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-cyan-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px bg-cyan-500/20" />
            </div>

            {/* Rotating radar scan sweep */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${themeStyle.radarSweep} to-transparent animate-spin origin-center duration-3000`} />

            {/* Center player indicator (airplane icon pointing forward) */}
            <div className="relative z-10 w-4 h-4 flex items-center justify-center">
              <Navigation2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 rotate-0 drop-shadow-[0_0_8px_rgba(6,182,212,1)]" />
            </div>

            {/* Target objective blip on radar perimeter */}
            {currentTargetLandmark() && (
              <div
                className="absolute w-3 h-3 flex items-center justify-center transition-all duration-300"
                style={{
                  transform: `rotate(${relativeBearing}deg) translate(0, -38px) rotate(-${relativeBearing}deg)`
                }}
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Distance to target indicator */}
          {currentTargetLandmark() && (
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-400 uppercase">Target Beacon</span>
              <span className="font-black text-xs sm:text-sm text-cyan-300">
                {targetDistMeters < 1000 ? `${targetDistMeters}m` : `${targetDistKm.toFixed(1)}km`}
              </span>
              <span className="text-[9px] text-slate-400 truncate max-w-[130px]">
                {currentTargetLandmark()?.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CENTER: Main Interactive Game Mode Deck */}
      <div className="absolute bottom-3 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-[580px] max-w-[95vw] pointer-events-auto">
        {/* MODE 1: FLIGHT RUSH CHECKPOINT RACER */}
        {gameMode === 'FLIGHT_RUSH' && (
          <div className={`p-3 sm:p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-3 shadow-2xl ${themeStyle.panel}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    Gate {currentGateIdx + 1} of {checkpoints.length}
                    <span className="text-[10px] font-mono text-cyan-400">
                      • {checkpoints[currentGateIdx]?.name}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Fly camera through the 3D aerial ring hovering above the landmark!
                  </p>
                </div>
              </div>

              {/* Time Remaining */}
              <div className="flex flex-col items-end">
                <div className={`text-base sm:text-xl font-black font-mono ${courseTimer <= 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  00:{courseTimer.toString().padStart(2, '0')}
                </div>
                {lastSplitTime && (
                  <span className="text-[9px] text-emerald-400 font-bold">{lastSplitTime}</span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
              {!courseRunning && !courseFinished ? (
                <button
                  onClick={startFlightRushCourse}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Checkpoint Rush Course</span>
                </button>
              ) : courseFinished ? (
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Course Complete! All Sky Gates Cleared</span>
                  </div>
                  <button
                    onClick={startFlightRushCourse}
                    className="py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Replay
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={flyToCurrentGate}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Autopilot to Gate</span>
                  </button>

                  <button
                    onClick={handlePassCheckpoint}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clear Gate (+{checkpoints[currentGateIdx]?.bonusPoints} XP)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: SCAVENGER QUEST */}
        {gameMode === 'QUEST' && (
          <div className={`p-3 sm:p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-2.5 shadow-2xl ${themeStyle.panel}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Objective {currentQuestIdx + 1} of {quests.length}: {quests[currentQuestIdx]?.title}
                  </h3>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Reward: +{quests[currentQuestIdx]?.points} XP
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Proximity</span>
                <div className="font-mono font-bold text-xs sm:text-sm text-cyan-300">
                  {targetDistMeters < 300 ? '🔥 VERY HOT!' : targetDistMeters < 800 ? '🟡 WARM' : '🔵 COLD'}
                </div>
              </div>
            </div>

            {/* Clue Box */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed">
              <p className="italic">"{quests[currentQuestIdx]?.clue}"</p>
              {questHintRevealed && (
                <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-amber-300 font-medium">
                  💡 Hint: {quests[currentQuestIdx]?.hint}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
              <button
                onClick={() => {
                  setQuestHintRevealed(true);
                  sounds.playRadarPing();
                }}
                disabled={questHintRevealed}
                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{questHintRevealed ? 'Hint Revealed' : 'Reveal Clue Hint'}</span>
              </button>

              <button
                onClick={handleClaimQuestLandmark}
                className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/50 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Found & Claim Target</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: GEOGUESSR 3D MYSTERY */}
        {gameMode === 'GEOGUESSR' && (
          <div className={`p-3 sm:p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-2.5 shadow-2xl ${themeStyle.panel}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Mystery Landmark #{guessrIdx + 1}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Observe the 3D architecture & topography. Which site is this?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{stats.guessrStreak}x Streak</span>
              </div>
            </div>

            {/* 4 Multiple Choice Options */}
            <div className="grid grid-cols-2 gap-2">
              {geoQuestions[guessrIdx]?.options.map(opt => {
                const isSelected = guessrSelectedId === opt.id;
                const isCorrect = guessrResult === 'CORRECT' && opt.id === geoQuestions[guessrIdx].correctLandmarkId;
                const isWrong = isSelected && guessrResult === 'WRONG';

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleGuessrAnswer(opt.id)}
                    disabled={guessrResult !== null}
                    className={`p-2.5 rounded-xl border text-left font-semibold text-xs transition-all cursor-pointer ${
                      isCorrect
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                        : isWrong
                        ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                        : 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    }`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>

            {/* Result banner & Next button */}
            {guessrResult && (
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className={`text-xs font-bold ${guessrResult === 'CORRECT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {guessrResult === 'CORRECT' ? '✓ Correct! +350 XP awarded' : '✗ Incorrect site!'}
                </span>
                <button
                  onClick={() => {
                    const next = (guessrIdx + 1) % geoQuestions.length;
                    setGuessrIdx(next);
                    startGeoGuessrDrop(next);
                  }}
                  className="py-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Next Challenge</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 4: FREE ROAM SANDBOX */}
        {gameMode === 'FREE_ROAM' && (
          <div className={`p-3 rounded-2xl border backdrop-blur-md flex items-center justify-between shadow-2xl ${themeStyle.panel}`}>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400 animate-spin" />
              <div>
                <h3 className="font-bold text-xs text-white">Free Aerial Sandbox</h3>
                <p className="text-[10px] text-slate-400">
                  Fly anywhere using keyboard [WASD] or on-screen flight stick. Press Space for Turbo Boost!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsBoostActive(true);
                  sounds.playBoost();
                  setTimeout(() => setIsBoostActive(false), 2000);
                }}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Turbo Boost</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE / ON-SCREEN TOUCH FLIGHT CONTROLS (Bottom Right) */}
      <div className="sm:hidden absolute bottom-44 right-3 pointer-events-auto flex flex-col items-center gap-1 bg-black/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => steerCamera(0.003, 0, 0, 0, 0)}
          className="w-10 h-10 rounded-xl bg-white/10 active:bg-cyan-500/30 flex items-center justify-center text-white"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => steerCamera(0, -0.003, 0, 0, 0)}
            className="w-10 h-10 rounded-xl bg-white/10 active:bg-cyan-500/30 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setIsBoostActive(true);
              sounds.playBoost();
              steerCamera(0.005, 0, 0, 0, -80);
              setTimeout(() => setIsBoostActive(false), 800);
            }}
            className="w-10 h-10 rounded-xl bg-cyan-600 active:bg-cyan-400 flex items-center justify-center text-white font-black text-xs"
          >
            ⚡
          </button>
          <button
            onClick={() => steerCamera(0, 0.003, 0, 0, 0)}
            className="w-10 h-10 rounded-xl bg-white/10 active:bg-cyan-500/30 flex items-center justify-center text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => steerCamera(-0.003, 0, 0, 0, 0)}
          className="w-10 h-10 rounded-xl bg-white/10 active:bg-cyan-500/30 flex items-center justify-center text-white"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* CONTROLS GUIDE MODAL */}
      <AnimatePresence>
        {showControlsGuide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto"
          >
            <div className={`w-full max-w-md p-5 rounded-3xl border ${themeStyle.panel} shadow-2xl flex flex-col gap-4`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-extrabold text-base text-white">City Game Map Flight Controls</h2>
                </div>
                <button
                  onClick={() => setShowControlsGuide(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">W / S / ↑ / ↓</span>
                  <span className="text-slate-400 text-[11px]">Fly forward & backward over city buildings</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">A / D / ← / →</span>
                  <span className="text-slate-400 text-[11px]">Strafe & bank left / right across streets</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">Spacebar</span>
                  <span className="text-slate-400 text-[11px]">Turbo Afterburner Boost (Speed up to 180 km/h)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">Q / E</span>
                  <span className="text-slate-400 text-[11px]">Yaw & pivot camera heading 360°</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">R / F</span>
                  <span className="text-slate-400 text-[11px]">Pitch tilt camera up / down</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="font-bold text-cyan-300">Radar Ping</span>
                  <span className="text-slate-400 text-[11px]">Track target bearings on the minimap blip</span>
                </div>
              </div>

              <button
                onClick={() => setShowControlsGuide(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider uppercase cursor-pointer"
              >
                Ready to Fly
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
