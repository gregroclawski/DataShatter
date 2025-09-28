// Zone and Enemy Data for 50-Zone Progression System  
// Linear progression: Early zones have fewer kills, later zones have more kills
// Total progression designed for players to reach higher XP zones faster

export interface EnemyType {
  id: string;
  name: string;
  icon: string;
  baseHP: number;
  baseAttack: number;
  baseXP: number;
  resistances?: {
    physical?: number;
    magic?: number;
    fire?: number;
    ice?: number;
  };
}

export interface ZoneLevel {
  level: number;
  enemyMultiplier: number; // HP/Attack multiplier for this level
  xpMultiplier: number;
  requiredKills: number; // Scales with zone progression for linear gameplay
  enemyTypes: string[]; // Enemy IDs that spawn in this level
}

export interface Zone {
  id: number;
  name: string;
  theme: string;
  description: string;
  minPlayerLevel: number;
  maxPlayerLevel: number;
  levels: ZoneLevel[];
  backgroundImage?: string;
  unlockRequirement: {
    previousZone?: number;
    bossDefeated?: boolean;
  };
}

// Enemy Types Database
export const ENEMY_TYPES: Record<string, EnemyType> = {
  // Forest Realms (Zones 1-10)
  'forest_goblin': {
    id: 'forest_goblin',
    name: 'Forest Goblin',
    icon: '👹',
    baseHP: 15,
    baseAttack: 8,
    baseXP: 20,
  },
  'wild_wolf': {
    id: 'wild_wolf', 
    name: 'Wild Wolf',
    icon: '🐺',
    baseHP: 25,
    baseAttack: 12,
    baseXP: 15,
  },
  'tree_guardian': {
    id: 'tree_guardian',
    name: 'Tree Guardian', 
    icon: '🌳',
    baseHP: 45,
    baseAttack: 15,
    baseXP: 25,
    resistances: { physical: 0.2 }
  },
  'dark_sprite': {
    id: 'dark_sprite',
    name: 'Dark Sprite',
    icon: '🧚‍♀️',
    baseHP: 20,
    baseAttack: 18,
    baseXP: 20,
    resistances: { magic: 0.3 }
  },

  // Desert Kingdoms (Zones 11-20)  
  'sand_scorpion': {
    id: 'sand_scorpion',
    name: 'Sand Scorpion',
    icon: '🦂',
    baseHP: 35,
    baseAttack: 22,
    baseXP: 30,
  },
  'desert_bandit': {
    id: 'desert_bandit', 
    name: 'Desert Bandit',
    icon: '🏴‍☠️',
    baseHP: 50,
    baseAttack: 28,
    baseXP: 40,
  },
  'fire_elemental': {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    icon: '🔥',
    baseHP: 60,
    baseAttack: 35,
    baseXP: 50,
    resistances: { fire: 0.8, ice: -0.5 }
  },
  'crystal_golem': {
    id: 'crystal_golem',
    name: 'Crystal Golem',
    icon: '💎',
    baseHP: 80,
    baseAttack: 30,
    baseXP: 45,
    resistances: { physical: 0.4 }
  },

  // Mountain Peaks (Zones 21-30)
  'mountain_orc': {
    id: 'mountain_orc',
    name: 'Mountain Orc',
    icon: '👹',
    baseHP: 75,
    baseAttack: 45,
    baseXP: 60,
  },
  'ice_troll': {
    id: 'ice_troll',
    name: 'Ice Troll',
    icon: '🧊',
    baseHP: 100,
    baseAttack: 40,
    baseXP: 70,
    resistances: { ice: 0.6, fire: -0.3 }
  },
  'wind_eagle': {
    id: 'wind_eagle',
    name: 'Wind Eagle',
    icon: '🦅',
    baseHP: 60,
    baseAttack: 55,
    baseXP: 65,
  },
  'stone_giant': {
    id: 'stone_giant',
    name: 'Stone Giant',
    icon: '⛰️',
    baseHP: 150,
    baseAttack: 50,
    baseXP: 80,
    resistances: { physical: 0.5 }
  },

  // Underground Depths (Zones 31-40)
  'cave_spider': {
    id: 'cave_spider',
    name: 'Cave Spider',
    icon: '🕷️',
    baseHP: 90,
    baseAttack: 60,
    baseXP: 85,
  },
  'shadow_bat': {
    id: 'shadow_bat',
    name: 'Shadow Bat',
    icon: '🦇',
    baseHP: 70,
    baseAttack: 70,
    baseXP: 90,
  },
  'lava_demon': {
    id: 'lava_demon',
    name: 'Lava Demon',
    icon: '😈',
    baseHP: 120,
    baseAttack: 75,
    baseXP: 100,
    resistances: { fire: 0.7 }
  },
  'crystal_wraith': {
    id: 'crystal_wraith',
    name: 'Crystal Wraith',
    icon: '👻',
    baseHP: 100,
    baseAttack: 80,
    baseXP: 110,
    resistances: { magic: 0.4 }
  },

  // Mystical Planes (Zones 41-50)
  'void_stalker': {
    id: 'void_stalker',
    name: 'Void Stalker',
    icon: '🌌',
    baseHP: 200,
    baseAttack: 100,
    baseXP: 150,
  },
  'celestial_guardian': {
    id: 'celestial_guardian',
    name: 'Celestial Guardian',
    icon: '⭐',
    baseHP: 250,
    baseAttack: 120,
    baseXP: 180,
    resistances: { magic: 0.6 }
  },
  'chaos_lord': {
    id: 'chaos_lord',
    name: 'Chaos Lord',
    icon: '👑',
    baseHP: 300,
    baseAttack: 150,
    baseXP: 200,
  },
  'ancient_dragon': {
    id: 'ancient_dragon',
    name: 'Ancient Dragon',
    icon: '🐲',
    baseHP: 500,
    baseAttack: 200,
    baseXP: 300,
    resistances: { fire: 0.8, physical: 0.3 }
  }
};

// Helper function to calculate linear progression kill requirements
const calculateKillRequirement = (zoneId: number, level: number): number => {
  // Early zones: Very low kills to allow fast progression to better XP zones
  // Later zones: More kills as players are stronger and want endgame content
  
  if (zoneId <= 5) return 25 + (level * 5);      // Zones 1-5: 30-50 kills per level
  if (zoneId <= 15) return 40 + (level * 10);     // Zones 6-15: 50-90 kills per level  
  if (zoneId <= 30) return 60 + (level * 15);     // Zones 16-30: 75-135 kills per level
  if (zoneId <= 45) return 100 + (level * 20);    // Zones 31-45: 120-200 kills per level
  return 150 + (level * 25);                      // Zones 46-50: 175-275 kills per level (endgame)
};

// Zone Database - 50 Zones with 5 levels each
export const ZONES: Zone[] = [
  // Forest Realms (Zones 1-10)
  {
    id: 1,
    name: 'Whispering Woods',
    theme: 'Forest',
    description: 'A peaceful forest where adventure begins',
    minPlayerLevel: 1,
    maxPlayerLevel: 300,
    unlockRequirement: {},
    levels: [
      { level: 1, enemyMultiplier: 1.0, xpMultiplier: 1.0, requiredKills: calculateKillRequirement(1, 1), enemyTypes: ['forest_goblin'] },
      { level: 2, enemyMultiplier: 1.2, xpMultiplier: 1.1, requiredKills: calculateKillRequirement(1, 2), enemyTypes: ['forest_goblin', 'wild_wolf'] },
      { level: 3, enemyMultiplier: 1.4, xpMultiplier: 1.2, requiredKills: calculateKillRequirement(1, 3), enemyTypes: ['wild_wolf'] },
      { level: 4, enemyMultiplier: 1.6, xpMultiplier: 1.3, requiredKills: calculateKillRequirement(1, 4), enemyTypes: ['wild_wolf', 'tree_guardian'] },
      { level: 5, enemyMultiplier: 1.8, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(1, 5), enemyTypes: ['tree_guardian'] }
    ]
  },
  {
    id: 2,
    name: 'Darkwood Grove',
    theme: 'Forest',
    description: 'Shadows dance between ancient trees',
    minPlayerLevel: 300,
    maxPlayerLevel: 600,
    unlockRequirement: { previousZone: 1 },
    levels: [
      { level: 1, enemyMultiplier: 2.0, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(2, 1), enemyTypes: ['dark_sprite'] },
      { level: 2, enemyMultiplier: 2.3, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(2, 2), enemyTypes: ['dark_sprite', 'wild_wolf'] },
      { level: 3, enemyMultiplier: 2.6, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(2, 3), enemyTypes: ['tree_guardian', 'dark_sprite'] },
      { level: 4, enemyMultiplier: 3.0, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(2, 4), enemyTypes: ['tree_guardian'] },
      { level: 5, enemyMultiplier: 3.4, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(2, 5), enemyTypes: ['tree_guardian', 'dark_sprite'] }
    ]
  },

  // Desert Kingdoms (Zones 11-12 as examples)
  {
    id: 11,
    name: 'Burning Sands',
    theme: 'Desert',
    description: 'Endless dunes hide deadly predators',
    minPlayerLevel: 3000,
    maxPlayerLevel: 3300,
    unlockRequirement: { previousZone: 10 },
    levels: [
      { level: 1, enemyMultiplier: 8.0, xpMultiplier: 5.0, requiredKills: 1000, enemyTypes: ['sand_scorpion'] },
      { level: 2, enemyMultiplier: 9.0, xpMultiplier: 5.5, requiredKills: 1000, enemyTypes: ['sand_scorpion', 'desert_bandit'] },
      { level: 3, enemyMultiplier: 10.0, xpMultiplier: 6.0, requiredKills: 1000, enemyTypes: ['desert_bandit'] },
      { level: 4, enemyMultiplier: 11.0, xpMultiplier: 6.5, requiredKills: 1000, enemyTypes: ['desert_bandit', 'fire_elemental'] },
      { level: 5, enemyMultiplier: 12.0, xpMultiplier: 7.0, requiredKills: 1000, enemyTypes: ['fire_elemental'] }
    ]
  },
  
  // Mystical Planes (Zone 50 as final example)
  {
    id: 50,
    name: 'Nexus of Eternity',
    theme: 'Mystical',
    description: 'Where reality bends to cosmic forces',
    minPlayerLevel: 14700,
    maxPlayerLevel: 15000,
    unlockRequirement: { previousZone: 49, bossDefeated: true },
    levels: [
      { level: 1, enemyMultiplier: 100.0, xpMultiplier: 50.0, requiredKills: 1000, enemyTypes: ['void_stalker'] },
      { level: 2, enemyMultiplier: 120.0, xpMultiplier: 60.0, requiredKills: 1000, enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 3, enemyMultiplier: 140.0, xpMultiplier: 70.0, requiredKills: 1000, enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 4, enemyMultiplier: 160.0, xpMultiplier: 80.0, requiredKills: 1000, enemyTypes: ['chaos_lord'] },
      { level: 5, enemyMultiplier: 200.0, xpMultiplier: 100.0, requiredKills: 1000, enemyTypes: ['ancient_dragon'] }
    ]
  }
];

// Utility Functions
export const calculateEnemyStats = (enemyType: EnemyType, zoneLevel: ZoneLevel, zoneId: number) => {
  const scalingFactor = Math.pow(1.15, (zoneId - 1) * 5 + zoneLevel.level);
  
  return {
    hp: Math.floor(enemyType.baseHP * zoneLevel.enemyMultiplier * scalingFactor),
    attack: Math.floor(enemyType.baseAttack * zoneLevel.enemyMultiplier * scalingFactor),
    xp: Math.floor(enemyType.baseXP * zoneLevel.xpMultiplier * scalingFactor),
    resistances: enemyType.resistances
  };
};

export const getZoneByLevel = (playerLevel: number): Zone | null => {
  return ZONES.find(zone => 
    playerLevel >= zone.minPlayerLevel && 
    playerLevel <= zone.maxPlayerLevel
  ) || null;
};

export const isZoneUnlocked = (zoneId: number, playerProgress: any): boolean => {
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return false;
  
  if (!zone.unlockRequirement.previousZone) return true; // First zone
  
  // Check if previous zone is completed
  const prevZoneProgress = playerProgress[zone.unlockRequirement.previousZone];
  return prevZoneProgress?.completed || false;
};