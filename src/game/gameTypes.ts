export type GameMode = 'GTA_JESUS' | 'QUEST' | 'FLIGHT_RUSH' | 'GEOGUESSR' | 'FREE_ROAM';

export type GameHudTheme = 'CYBERPUNK' | 'AVIATION' | 'TACTICAL' | 'ARCADE' | 'GTA_VICE';

export type GtaVehicleMode = 'ROBES_WALK' | 'CHARIOT_CRUISER' | 'SERAPHIM_WINGS';

export interface GtaJesusMission {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  locationName: string;
  story: string;
  scriptureQuote: string;
  targetLat: number;
  targetLng: number;
  targetAltitude: number;
  targetRange: number;
  targetTilt: number;
  targetHeading: number;
  rewardGrace: number;
  rewardXp: number;
  miracleType: 'WATER_INTO_WINE' | 'CALM_THE_STRIP' | 'FEED_MULTITUDE' | 'HEAL_BROKEN' | 'LIGHT_THE_SPHERE' | 'ASCEND_STRAT';
  objectiveText: string;
  completionMessage: string;
}

export interface CheckpointGate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  range: number;
  tilt: number;
  heading: number;
  radiusMeters: number;
  bonusPoints: number;
}

export interface CityQuestObjective {
  id: string;
  landmarkId: string;
  title: string;
  clue: string;
  hint: string;
  trivia: string;
  points: number;
}

export interface GeoGuessrQuestion {
  id: string;
  correctLandmarkId: string;
  mysteryPrompt: string;
  options: { id: string; name: string }[];
  hint: string;
  camOffset: {
    latOffset: number;
    lngOffset: number;
    altitude: number;
    range: number;
    tilt: number;
    heading: number;
  };
}

export interface PlayerStats {
  score: number;
  coinsCollected: number;
  checkpointsCleared: number;
  guessrStreak: number;
  bestStreak: number;
  discoveredLandmarkIds: string[];
  totalFlightDistanceKm: number;
  rankTitle: string;
  level: number;
  xp: number;
  // GTA Jesus Mode stats
  graceStars: number; // 0 to 5 Stars
  divineAura: number; // 0 to 100%
  miraclesCompleted: number;
  completedMissionIds: string[];
}
