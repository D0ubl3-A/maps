import { CityConfig, Landmark } from '../utils';
import { CityQuestObjective, CheckpointGate, GeoGuessrQuestion } from './gameTypes';

/**
 * Builds dynamic Scavenger Hunt Quests for any given city
 */
export function getCityQuests(city: CityConfig): CityQuestObjective[] {
  const landmarks = city.landmarks;
  if (!landmarks || landmarks.length === 0) return [];

  return landmarks.map((lm, idx) => {
    // Generate fun, engaging riddles & clues based on category, description, and highlights
    const clueText = lm.description || `Iconic landmark in ${city.name}`;
    const highlightHint = lm.highlights && lm.highlights.length > 0 
      ? `Notable feature: ${lm.highlights[0]}` 
      : `Category: ${lm.category}`;

    return {
      id: `quest-${city.id}-${lm.id}`,
      landmarkId: lm.id,
      title: `Search for ${lm.name}`,
      clue: `Agent, navigate through ${city.name} to find this site: "${clueText.slice(0, 110)}..."`,
      hint: highlightHint,
      trivia: lm.highlights ? lm.highlights.join(' • ') : lm.description,
      points: 150 + (idx * 25)
    };
  });
}

/**
 * Builds sequential 3D Flight Checkpoint Gates across the city
 */
export function getCityCheckpoints(city: CityConfig): CheckpointGate[] {
  const landmarks = city.landmarks;
  if (!landmarks || landmarks.length === 0) return [];

  return landmarks.map((lm, index) => {
    return {
      id: `gate-${city.id}-${lm.id}-${index}`,
      name: `${lm.name} Sky Gate`,
      lat: lm.lat,
      lng: lm.lng,
      altitude: Math.max(lm.altitude || 50, 45) + 30, // Hover above landmark
      range: Math.min(lm.camRange || 800, 700),
      tilt: Math.min(lm.camTilt || 65, 70),
      heading: lm.camHeading || (index * 45) % 360,
      radiusMeters: 180, // Trigger tolerance radius
      bonusPoints: 200 + index * 50
    };
  });
}

/**
 * Generates GeoGuessr mystery challenges for the city
 */
export function getCityGeoQuestions(city: CityConfig): GeoGuessrQuestion[] {
  const landmarks = city.landmarks;
  if (!landmarks || landmarks.length < 2) return [];

  return landmarks.map((lm, idx) => {
    // Pick 3 distractors
    const otherLandmarks = landmarks.filter(l => l.id !== lm.id);
    const shuffledOthers = [...otherLandmarks].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);
    
    const allOptions = [
      { id: lm.id, name: lm.name },
      ...distractors.map(d => ({ id: d.id, name: d.name }))
    ].sort(() => 0.5 - Math.random());

    return {
      id: `guess-${city.id}-${lm.id}`,
      correctLandmarkId: lm.id,
      mysteryPrompt: `Examine the 3D architecture, orientation, and surrounding cityscape. Which famous site are you hovering above?`,
      options: allOptions,
      hint: lm.highlights && lm.highlights.length > 0 ? lm.highlights[0] : lm.category,
      camOffset: {
        latOffset: 0.001,
        lngOffset: 0.001,
        altitude: (lm.camAltitude || 60) + 20,
        range: (lm.camRange || 550) * 0.85,
        tilt: 62,
        heading: (lm.camHeading || 0) + (idx % 2 === 0 ? 30 : -30)
      }
    };
  });
}

/**
 * Rank system based on player score & achievements
 */
export const RANKS = [
  { minXp: 0, title: 'Ground Scout', level: 1 },
  { minXp: 300, title: 'Aerial Spotter', level: 2 },
  { minXp: 800, title: 'City Navigator', level: 3 },
  { minXp: 1600, title: 'Sky Cartographer', level: 4 },
  { minXp: 2800, title: 'Drone Ace', level: 5 },
  { minXp: 4500, title: 'Urban Topographer', level: 6 },
  { minXp: 7000, title: 'Legendary Aviator', level: 7 },
  { minXp: 10000, title: 'Grandmaster of the Skies', level: 8 }
];

export function calculateRank(xp: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) {
      rank = r;
    } else {
      break;
    }
  }
  return rank;
}

import { GtaJesusMission } from './gameTypes';

/**
 * Builds GTA-Style "Grand Theft Apostle: Sin City Redemption" missions for Las Vegas & world cities
 */
export function getCityGtaJesusMissions(city: CityConfig): GtaJesusMission[] {
  if (city.id === 'las-vegas') {
    return [
      {
        id: 'gta-vegas-m1',
        number: 1,
        title: 'MISSION I: LIVING WATERS',
        subtitle: 'Purify the Lake of Bellagio',
        locationName: 'Bellagio Fountains & Lake',
        story: 'Las Vegas has gambled away its peace. Pilot your avatar down the Strip to the 8.5-acre Bellagio lake and bring serene living water to the desert.',
        scriptureQuote: '"Whoever drinks of this water will thirst again, but whoever drinks of the water that I give him will never thirst." — John 4:13-14',
        targetLat: 36.1126,
        targetLng: -115.1767,
        targetAltitude: 65,
        targetRange: 600,
        targetTilt: 60,
        targetHeading: 85,
        rewardGrace: 1,
        rewardXp: 500,
        miracleType: 'WATER_INTO_WINE',
        objectiveText: 'Approach the Bellagio Fountains and cast the Blessing of Living Waters',
        completionMessage: 'MISSION PASSED! The waters are blessed, and peace descends upon the Strip (+1 Grace Star)'
      },
      {
        id: 'gta-vegas-m2',
        number: 2,
        title: 'MISSION II: THE LIGHT OF THE WORLD',
        subtitle: 'Illuminate the 580,000 sq ft Exosphere',
        locationName: 'The Sphere, Las Vegas',
        story: 'The colossal 366-foot Sphere stands as a monument to artificial illumination. Transform the exosphere with celestial truth.',
        scriptureQuote: '"I am the light of the world. He who follows Me shall not walk in darkness, but have the light of life." — John 8:12',
        targetLat: 36.1212,
        targetLng: -115.1621,
        targetAltitude: 140,
        targetRange: 620,
        targetTilt: 55,
        targetHeading: 220,
        rewardGrace: 1,
        rewardXp: 650,
        miracleType: 'LIGHT_THE_SPHERE',
        objectiveText: 'Orbit the Sphere and trigger the Celestial Exosphere Revelation',
        completionMessage: 'MISSION PASSED! The Sphere radiates divine luminescence across the Nevada desert (+1 Grace Star)'
      },
      {
        id: 'gta-vegas-m3',
        number: 3,
        title: 'MISSION III: CALM THE DESERT TEMPEST',
        subtitle: 'Pacify the Chaos of Las Vegas Boulevard',
        locationName: 'The Strip / Caesar’s Colosseum Corridor',
        story: 'Reckless drift and high-stakes chaos surge down Las Vegas Blvd. Cruise down the main boulevard and speak peace over the rushing crowds.',
        scriptureQuote: '"Then He arose and rebuked the wind, and said to the sea, ‘Peace, be still!’ And there was a great calm." — Mark 4:39',
        targetLat: 36.1162,
        targetLng: -115.1745,
        targetAltitude: 80,
        targetRange: 750,
        targetTilt: 65,
        targetHeading: 15,
        rewardGrace: 1,
        rewardXp: 800,
        miracleType: 'CALM_THE_STRIP',
        objectiveText: 'Speed down the central Strip corridor and cast the Aura of Peace',
        completionMessage: 'MISSION PASSED! The chaos subsides into peaceful harmony along the casino corridor (+1 Grace Star)'
      },
      {
        id: 'gta-vegas-m4',
        number: 4,
        title: 'MISSION IV: HIGH PINNACLE DELIVERANCE',
        subtitle: 'Ascend to the STRAT Observation Tower',
        locationName: 'The STRAT Tower (1,149 ft)',
        story: 'High above the neon lights, looking out over the entire Las Vegas valley, offer a blessing over every weary soul in the desert city.',
        scriptureQuote: '"He set my feet upon a rock, and established my steps." — Psalm 40:2',
        targetLat: 36.1475,
        targetLng: -115.1555,
        targetAltitude: 360,
        targetRange: 680,
        targetTilt: 55,
        targetHeading: 170,
        rewardGrace: 1,
        rewardXp: 1000,
        miracleType: 'ASCEND_STRAT',
        objectiveText: 'Ascend above the 350-meter summit of the STRAT Tower',
        completionMessage: 'MISSION PASSED! You have overseen all of Sin City with supreme grace (+1 Grace Star)'
      },
      {
        id: 'gta-vegas-m5',
        number: 5,
        title: 'MISSION V: FEED THE MULTITUDES',
        subtitle: 'Grand Miracle Across the Neon Oasis',
        locationName: 'Fremont & Downtown Vegas',
        story: 'Gather the wandering desert travelers and bestow boundless abundance upon everyone seeking hope in the city.',
        scriptureQuote: '"They all ate and were filled, and twelve baskets of fragments were taken up." — Matthew 14:20',
        targetLat: 36.1700,
        targetLng: -115.1440,
        targetAltitude: 90,
        targetRange: 800,
        targetTilt: 60,
        targetHeading: 45,
        rewardGrace: 1,
        rewardXp: 1500,
        miracleType: 'FEED_MULTITUDE',
        objectiveText: 'Perform the Miracle of Multiplication across Downtown Vegas',
        completionMessage: 'GRAND MISSION PASSED! Maximum 5-Star Grace Reached! Las Vegas is redeemed into the City of Light!'
      }
    ];
  }

  // Dynamic missions for other cities
  return city.landmarks.slice(0, 5).map((lm, idx) => ({
    id: `gta-${city.id}-m${idx + 1}`,
    number: idx + 1,
    title: `MISSION ${idx + 1}: BLESSING OF ${lm.name.toUpperCase()}`,
    subtitle: `Bring Divine Grace to ${lm.name}`,
    locationName: lm.name,
    story: `Navigate your avatar to ${lm.name} in ${city.name} to cast blessings of reconciliation and peace.`,
    scriptureQuote: '"Blessed are the peacemakers, for they shall be called sons of God." — Matthew 5:9',
    targetLat: lm.lat,
    targetLng: lm.lng,
    targetAltitude: Math.max(lm.altitude || 50, 40) + 20,
    targetRange: lm.camRange || 650,
    targetTilt: lm.camTilt || 60,
    targetHeading: lm.camHeading || 0,
    rewardGrace: 1,
    rewardXp: 500 + idx * 200,
    miracleType: (['WATER_INTO_WINE', 'LIGHT_THE_SPHERE', 'CALM_THE_STRIP', 'ASCEND_STRAT', 'FEED_MULTITUDE'] as const)[idx % 5],
    objectiveText: `Reach ${lm.name} and cast the Celestial Blessing`,
    completionMessage: `MISSION PASSED! ${lm.name} is enveloped in holy grace (+1 Grace Star)`
  }));
}
