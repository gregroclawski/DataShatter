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
  'shadow_wolf': {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    icon: '🐺',
    baseHP: 30,
    baseAttack: 20,
    baseXP: 25,
    resistances: { magic: 0.2 }
  },
  'forest_troll': {
    id: 'forest_troll',
    name: 'Forest Troll',
    icon: '👹',
    baseHP: 60,
    baseAttack: 25,
    baseXP: 35,
    resistances: { physical: 0.3 }
  },
  'ancient_ent': {
    id: 'ancient_ent',
    name: 'Ancient Ent',
    icon: '🌲',
    baseHP: 80,
    baseAttack: 30,
    baseXP: 45,
    resistances: { physical: 0.4, fire: -0.3 }
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

// Zone Database - Complete 50 Zones with 5 levels each
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
    name: 'Whispering Grove',
    theme: 'forest',
    description: 'Deeper into the forest where ancient spirits dwell.',
    minPlayerLevel: 8,
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
  {
    id: 3,
    name: 'Shadow Woods',
    theme: 'forest',
    description: 'Dark woods where shadows come alive.',
    minPlayerLevel: 15,
    maxPlayerLevel: 900,
    unlockRequirement: { previousZone: 2 },
    levels: [
      { level: 1, enemyMultiplier: 3.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(3, 1), enemyTypes: ['shadow_wolf', 'dark_sprite'] },
      { level: 2, enemyMultiplier: 4.2, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(3, 2), enemyTypes: ['shadow_wolf', 'tree_guardian'] },
      { level: 3, enemyMultiplier: 4.6, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(3, 3), enemyTypes: ['tree_guardian', 'forest_troll'] },
      { level: 4, enemyMultiplier: 5.0, xpMultiplier: 2.6, requiredKills: calculateKillRequirement(3, 4), enemyTypes: ['forest_troll'] },
      { level: 5, enemyMultiplier: 5.4, xpMultiplier: 2.8, requiredKills: calculateKillRequirement(3, 5), enemyTypes: ['forest_troll', 'ancient_ent'] }
    ]
  },
  {
    id: 4,
    name: 'Ancient Forest',
    theme: 'forest',
    description: 'The heart of the forest where ancient guardians protect their domain.',
    minPlayerLevel: 25,
    maxPlayerLevel: 1200,
    unlockRequirement: { previousZone: 3 },
    levels: [
      { level: 1, enemyMultiplier: 5.8, xpMultiplier: 3.0, requiredKills: calculateKillRequirement(4, 1), enemyTypes: ['ancient_ent'] },
      { level: 2, enemyMultiplier: 6.2, xpMultiplier: 3.2, requiredKills: calculateKillRequirement(4, 2), enemyTypes: ['ancient_ent', 'forest_troll'] },
      { level: 3, enemyMultiplier: 6.6, xpMultiplier: 3.4, requiredKills: calculateKillRequirement(4, 3), enemyTypes: ['forest_troll', 'tree_guardian'] },
      { level: 4, enemyMultiplier: 7.0, xpMultiplier: 3.6, requiredKills: calculateKillRequirement(4, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 7.4, xpMultiplier: 3.8, requiredKills: calculateKillRequirement(4, 5), enemyTypes: ['ancient_ent'] }
    ]
  },
  {
    id: 5,
    name: 'Thornwood Thicket',
    theme: 'forest',
    description: 'Dense thickets where nature turns hostile.',
    minPlayerLevel: 35,
    maxPlayerLevel: 1500,
    unlockRequirement: { previousZone: 4 },
    levels: [
      { level: 1, enemyMultiplier: 7.8, xpMultiplier: 4.0, requiredKills: calculateKillRequirement(5, 1), enemyTypes: ['tree_guardian', 'forest_troll'] },
      { level: 2, enemyMultiplier: 8.2, xpMultiplier: 4.2, requiredKills: calculateKillRequirement(5, 2), enemyTypes: ['forest_troll', 'ancient_ent'] },
      { level: 3, enemyMultiplier: 8.6, xpMultiplier: 4.4, requiredKills: calculateKillRequirement(5, 3), enemyTypes: ['ancient_ent'] },
      { level: 4, enemyMultiplier: 9.0, xpMultiplier: 4.6, requiredKills: calculateKillRequirement(5, 4), enemyTypes: ['ancient_ent', 'shadow_wolf'] },
      { level: 5, enemyMultiplier: 9.4, xpMultiplier: 4.8, requiredKills: calculateKillRequirement(5, 5), enemyTypes: ['ancient_ent'] }
    ]
  },
  {
    id: 6,
    name: 'Misty Hollows',
    theme: 'forest',
    description: 'Mystical hollows shrouded in eternal mist.',
    minPlayerLevel: 50,
    maxPlayerLevel: 1800,
    unlockRequirement: { previousZone: 5 },
    levels: [
      { level: 1, enemyMultiplier: 9.8, xpMultiplier: 5.0, requiredKills: calculateKillRequirement(6, 1), enemyTypes: ['dark_sprite', 'shadow_wolf'] },
      { level: 2, enemyMultiplier: 10.2, xpMultiplier: 5.2, requiredKills: calculateKillRequirement(6, 2), enemyTypes: ['shadow_wolf', 'forest_troll'] },
      { level: 3, enemyMultiplier: 10.6, xpMultiplier: 5.4, requiredKills: calculateKillRequirement(6, 3), enemyTypes: ['forest_troll', 'ancient_ent'] },
      { level: 4, enemyMultiplier: 11.0, xpMultiplier: 5.6, requiredKills: calculateKillRequirement(6, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 11.4, xpMultiplier: 5.8, requiredKills: calculateKillRequirement(6, 5), enemyTypes: ['ancient_ent'] }
    ]
  },
  {
    id: 7,
    name: 'Elderwood Sanctuary',
    theme: 'forest',
    description: 'Sacred groves where the oldest trees keep ancient secrets.',
    minPlayerLevel: 65,
    maxPlayerLevel: 2100,
    unlockRequirement: { previousZone: 6 },
    levels: [
      { level: 1, enemyMultiplier: 11.8, xpMultiplier: 6.0, requiredKills: calculateKillRequirement(7, 1), enemyTypes: ['ancient_ent'] },
      { level: 2, enemyMultiplier: 12.2, xpMultiplier: 6.2, requiredKills: calculateKillRequirement(7, 2), enemyTypes: ['ancient_ent', 'tree_guardian'] },
      { level: 3, enemyMultiplier: 12.6, xpMultiplier: 6.4, requiredKills: calculateKillRequirement(7, 3), enemyTypes: ['tree_guardian', 'forest_troll'] },
      { level: 4, enemyMultiplier: 13.0, xpMultiplier: 6.6, requiredKills: calculateKillRequirement(7, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 13.4, xpMultiplier: 6.8, requiredKills: calculateKillRequirement(7, 5), enemyTypes: ['ancient_ent'] }
    ]
  },
  {
    id: 8,
    name: 'Cursed Woodlands',
    theme: 'forest',
    description: 'Dark woodlands where nature has been corrupted by ancient curses.',
    minPlayerLevel: 80,
    maxPlayerLevel: 2400,
    unlockRequirement: { previousZone: 7 },
    levels: [
      { level: 1, enemyMultiplier: 13.8, xpMultiplier: 7.0, requiredKills: calculateKillRequirement(8, 1), enemyTypes: ['shadow_wolf', 'dark_sprite'] },
      { level: 2, enemyMultiplier: 14.2, xpMultiplier: 7.2, requiredKills: calculateKillRequirement(8, 2), enemyTypes: ['dark_sprite', 'forest_troll'] },
      { level: 3, enemyMultiplier: 14.6, xpMultiplier: 7.4, requiredKills: calculateKillRequirement(8, 3), enemyTypes: ['forest_troll', 'ancient_ent'] },
      { level: 4, enemyMultiplier: 15.0, xpMultiplier: 7.6, requiredKills: calculateKillRequirement(8, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 15.4, xpMultiplier: 7.8, requiredKills: calculateKillRequirement(8, 5), enemyTypes: ['ancient_ent', 'shadow_wolf'] }
    ]
  },
  {
    id: 9,
    name: 'Primal Grove',
    theme: 'forest',
    description: 'The most ancient part of the forest, where primal forces still reign.',
    minPlayerLevel: 100,
    maxPlayerLevel: 2700,
    unlockRequirement: { previousZone: 8 },
    levels: [
      { level: 1, enemyMultiplier: 15.8, xpMultiplier: 8.0, requiredKills: calculateKillRequirement(9, 1), enemyTypes: ['ancient_ent'] },
      { level: 2, enemyMultiplier: 16.2, xpMultiplier: 8.2, requiredKills: calculateKillRequirement(9, 2), enemyTypes: ['ancient_ent', 'forest_troll'] },
      { level: 3, enemyMultiplier: 16.6, xpMultiplier: 8.4, requiredKills: calculateKillRequirement(9, 3), enemyTypes: ['forest_troll', 'shadow_wolf'] },
      { level: 4, enemyMultiplier: 17.0, xpMultiplier: 8.6, requiredKills: calculateKillRequirement(9, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 17.4, xpMultiplier: 8.8, requiredKills: calculateKillRequirement(9, 5), enemyTypes: ['ancient_ent'] }
    ]
  },
  {
    id: 10,
    name: 'World Tree Base',
    theme: 'forest',
    description: 'The massive roots of the World Tree, gateway to other realms.',
    minPlayerLevel: 120,
    maxPlayerLevel: 3000,
    unlockRequirement: { previousZone: 9 },
    levels: [
      { level: 1, enemyMultiplier: 17.8, xpMultiplier: 9.0, requiredKills: calculateKillRequirement(10, 1), enemyTypes: ['ancient_ent'] },
      { level: 2, enemyMultiplier: 18.2, xpMultiplier: 9.2, requiredKills: calculateKillRequirement(10, 2), enemyTypes: ['ancient_ent', 'tree_guardian'] },
      { level: 3, enemyMultiplier: 18.6, xpMultiplier: 9.4, requiredKills: calculateKillRequirement(10, 3), enemyTypes: ['tree_guardian', 'ancient_ent'] },
      { level: 4, enemyMultiplier: 19.0, xpMultiplier: 9.6, requiredKills: calculateKillRequirement(10, 4), enemyTypes: ['ancient_ent'] },
      { level: 5, enemyMultiplier: 19.4, xpMultiplier: 9.8, requiredKills: calculateKillRequirement(10, 5), enemyTypes: ['ancient_ent'] }
    ]
  },

  // Desert Realms (Zones 11-20)
  {
    id: 11,
    name: 'Scorching Desert',
    theme: 'desert',
    description: 'Vast dunes where fire elementals and desert predators roam.',
    minPlayerLevel: 500,
    maxPlayerLevel: 3300,
    unlockRequirement: { previousZone: 10 },
    levels: [
      { level: 1, enemyMultiplier: 8.0, xpMultiplier: 5.0, requiredKills: calculateKillRequirement(11, 1), enemyTypes: ['sand_scorpion'] },
      { level: 2, enemyMultiplier: 9.0, xpMultiplier: 5.5, requiredKills: calculateKillRequirement(11, 2), enemyTypes: ['sand_scorpion', 'desert_bandit'] },
      { level: 3, enemyMultiplier: 10.0, xpMultiplier: 6.0, requiredKills: calculateKillRequirement(11, 3), enemyTypes: ['desert_bandit'] },
      { level: 4, enemyMultiplier: 11.0, xpMultiplier: 6.5, requiredKills: calculateKillRequirement(11, 4), enemyTypes: ['desert_bandit', 'fire_elemental'] },
      { level: 5, enemyMultiplier: 12.0, xpMultiplier: 7.0, requiredKills: calculateKillRequirement(11, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 12,
    name: 'Oasis of Mirages',
    theme: 'desert',
    description: 'Desert oases where reality bends in the heat.',
    minPlayerLevel: 550,
    maxPlayerLevel: 3600,
    unlockRequirement: { previousZone: 11 },
    levels: [
      { level: 1, enemyMultiplier: 12.5, xpMultiplier: 7.5, requiredKills: calculateKillRequirement(12, 1), enemyTypes: ['fire_elemental'] },
      { level: 2, enemyMultiplier: 13.0, xpMultiplier: 8.0, requiredKills: calculateKillRequirement(12, 2), enemyTypes: ['fire_elemental', 'desert_bandit'] },
      { level: 3, enemyMultiplier: 13.5, xpMultiplier: 8.5, requiredKills: calculateKillRequirement(12, 3), enemyTypes: ['desert_bandit', 'crystal_golem'] },
      { level: 4, enemyMultiplier: 14.0, xpMultiplier: 9.0, requiredKills: calculateKillRequirement(12, 4), enemyTypes: ['crystal_golem'] },
      { level: 5, enemyMultiplier: 14.5, xpMultiplier: 9.5, requiredKills: calculateKillRequirement(12, 5), enemyTypes: ['crystal_golem', 'fire_elemental'] }
    ]
  },
  {
    id: 13,
    name: 'Crystal Caverns',
    theme: 'desert',
    description: 'Underground crystal formations beneath the desert sands.',
    minPlayerLevel: 600,
    maxPlayerLevel: 3900,
    unlockRequirement: { previousZone: 12 },
    levels: [
      { level: 1, enemyMultiplier: 15.0, xpMultiplier: 10.0, requiredKills: calculateKillRequirement(13, 1), enemyTypes: ['crystal_golem'] },
      { level: 2, enemyMultiplier: 15.5, xpMultiplier: 10.5, requiredKills: calculateKillRequirement(13, 2), enemyTypes: ['crystal_golem', 'sand_scorpion'] },
      { level: 3, enemyMultiplier: 16.0, xpMultiplier: 11.0, requiredKills: calculateKillRequirement(13, 3), enemyTypes: ['sand_scorpion', 'fire_elemental'] },
      { level: 4, enemyMultiplier: 16.5, xpMultiplier: 11.5, requiredKills: calculateKillRequirement(13, 4), enemyTypes: ['fire_elemental'] },
      { level: 5, enemyMultiplier: 17.0, xpMultiplier: 12.0, requiredKills: calculateKillRequirement(13, 5), enemyTypes: ['crystal_golem'] }
    ]
  },
  {
    id: 14,
    name: 'Sandstorm Valley',
    theme: 'desert',
    description: 'A valley where eternal sandstorms rage with elemental fury.',
    minPlayerLevel: 650,
    maxPlayerLevel: 4200,
    unlockRequirement: { previousZone: 13 },
    levels: [
      { level: 1, enemyMultiplier: 17.5, xpMultiplier: 12.5, requiredKills: calculateKillRequirement(14, 1), enemyTypes: ['fire_elemental', 'desert_bandit'] },
      { level: 2, enemyMultiplier: 18.0, xpMultiplier: 13.0, requiredKills: calculateKillRequirement(14, 2), enemyTypes: ['desert_bandit', 'sand_scorpion'] },
      { level: 3, enemyMultiplier: 18.5, xpMultiplier: 13.5, requiredKills: calculateKillRequirement(14, 3), enemyTypes: ['sand_scorpion', 'crystal_golem'] },
      { level: 4, enemyMultiplier: 19.0, xpMultiplier: 14.0, requiredKills: calculateKillRequirement(14, 4), enemyTypes: ['crystal_golem'] },
      { level: 5, enemyMultiplier: 19.5, xpMultiplier: 14.5, requiredKills: calculateKillRequirement(14, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 15,
    name: 'Ember Dunes',
    theme: 'desert',
    description: 'Dunes that burn with inner fire, home to the fiercest elementals.',
    minPlayerLevel: 700,
    maxPlayerLevel: 4500,
    unlockRequirement: { previousZone: 14 },
    levels: [
      { level: 1, enemyMultiplier: 20.0, xpMultiplier: 15.0, requiredKills: calculateKillRequirement(15, 1), enemyTypes: ['fire_elemental'] },
      { level: 2, enemyMultiplier: 20.5, xpMultiplier: 15.5, requiredKills: calculateKillRequirement(15, 2), enemyTypes: ['fire_elemental', 'crystal_golem'] },
      { level: 3, enemyMultiplier: 21.0, xpMultiplier: 16.0, requiredKills: calculateKillRequirement(15, 3), enemyTypes: ['crystal_golem', 'desert_bandit'] },
      { level: 4, enemyMultiplier: 21.5, xpMultiplier: 16.5, requiredKills: calculateKillRequirement(15, 4), enemyTypes: ['fire_elemental'] },
      { level: 5, enemyMultiplier: 22.0, xpMultiplier: 17.0, requiredKills: calculateKillRequirement(15, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 16,
    name: 'Dune Sea',
    theme: 'desert',
    description: 'Endless sea of sand where travelers lose their way.',
    minPlayerLevel: 750,
    maxPlayerLevel: 4800,
    unlockRequirement: { previousZone: 15 },
    levels: [
      { level: 1, enemyMultiplier: 22.5, xpMultiplier: 17.5, requiredKills: calculateKillRequirement(16, 1), enemyTypes: ['sand_scorpion', 'desert_bandit'] },
      { level: 2, enemyMultiplier: 23.0, xpMultiplier: 18.0, requiredKills: calculateKillRequirement(16, 2), enemyTypes: ['desert_bandit', 'fire_elemental'] },
      { level: 3, enemyMultiplier: 23.5, xpMultiplier: 18.5, requiredKills: calculateKillRequirement(16, 3), enemyTypes: ['fire_elemental', 'crystal_golem'] },
      { level: 4, enemyMultiplier: 24.0, xpMultiplier: 19.0, requiredKills: calculateKillRequirement(16, 4), enemyTypes: ['crystal_golem'] },
      { level: 5, enemyMultiplier: 24.5, xpMultiplier: 19.5, requiredKills: calculateKillRequirement(16, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 17,
    name: 'Temple of Sands',
    theme: 'desert',
    description: 'Ancient temple half-buried in the shifting sands.',
    minPlayerLevel: 800,
    maxPlayerLevel: 5100,
    unlockRequirement: { previousZone: 16 },
    levels: [
      { level: 1, enemyMultiplier: 25.0, xpMultiplier: 20.0, requiredKills: calculateKillRequirement(17, 1), enemyTypes: ['crystal_golem', 'fire_elemental'] },
      { level: 2, enemyMultiplier: 25.5, xpMultiplier: 20.5, requiredKills: calculateKillRequirement(17, 2), enemyTypes: ['fire_elemental', 'desert_bandit'] },
      { level: 3, enemyMultiplier: 26.0, xpMultiplier: 21.0, requiredKills: calculateKillRequirement(17, 3), enemyTypes: ['desert_bandit', 'sand_scorpion'] },
      { level: 4, enemyMultiplier: 26.5, xpMultiplier: 21.5, requiredKills: calculateKillRequirement(17, 4), enemyTypes: ['crystal_golem'] },
      { level: 5, enemyMultiplier: 27.0, xpMultiplier: 22.0, requiredKills: calculateKillRequirement(17, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 18,
    name: 'Mirage Palace',
    theme: 'desert',
    description: 'A magnificent palace that may or may not be real.',
    minPlayerLevel: 850,
    maxPlayerLevel: 5400,
    unlockRequirement: { previousZone: 17 },
    levels: [
      { level: 1, enemyMultiplier: 27.5, xpMultiplier: 22.5, requiredKills: calculateKillRequirement(18, 1), enemyTypes: ['crystal_golem'] },
      { level: 2, enemyMultiplier: 28.0, xpMultiplier: 23.0, requiredKills: calculateKillRequirement(18, 2), enemyTypes: ['crystal_golem', 'fire_elemental'] },
      { level: 3, enemyMultiplier: 28.5, xpMultiplier: 23.5, requiredKills: calculateKillRequirement(18, 3), enemyTypes: ['fire_elemental'] },
      { level: 4, enemyMultiplier: 29.0, xpMultiplier: 24.0, requiredKills: calculateKillRequirement(18, 4), enemyTypes: ['fire_elemental', 'desert_bandit'] },
      { level: 5, enemyMultiplier: 29.5, xpMultiplier: 24.5, requiredKills: calculateKillRequirement(18, 5), enemyTypes: ['crystal_golem'] }
    ]
  },
  {
    id: 19,
    name: 'Solar Sanctum',
    theme: 'desert',
    description: 'Sacred grounds where the sun god is worshipped.',
    minPlayerLevel: 900,
    maxPlayerLevel: 5700,
    unlockRequirement: { previousZone: 18 },
    levels: [
      { level: 1, enemyMultiplier: 30.0, xpMultiplier: 25.0, requiredKills: calculateKillRequirement(19, 1), enemyTypes: ['fire_elemental'] },
      { level: 2, enemyMultiplier: 30.5, xpMultiplier: 25.5, requiredKills: calculateKillRequirement(19, 2), enemyTypes: ['fire_elemental', 'crystal_golem'] },
      { level: 3, enemyMultiplier: 31.0, xpMultiplier: 26.0, requiredKills: calculateKillRequirement(19, 3), enemyTypes: ['crystal_golem'] },
      { level: 4, enemyMultiplier: 31.5, xpMultiplier: 26.5, requiredKills: calculateKillRequirement(19, 4), enemyTypes: ['crystal_golem', 'fire_elemental'] },
      { level: 5, enemyMultiplier: 32.0, xpMultiplier: 27.0, requiredKills: calculateKillRequirement(19, 5), enemyTypes: ['fire_elemental'] }
    ]
  },
  {
    id: 20,
    name: 'Desert of Eternity',
    theme: 'desert',
    description: 'The final desert realm where time itself stands still.',
    minPlayerLevel: 950,
    maxPlayerLevel: 6000,
    unlockRequirement: { previousZone: 19 },
    levels: [
      { level: 1, enemyMultiplier: 32.5, xpMultiplier: 27.5, requiredKills: calculateKillRequirement(20, 1), enemyTypes: ['fire_elemental', 'crystal_golem'] },
      { level: 2, enemyMultiplier: 33.0, xpMultiplier: 28.0, requiredKills: calculateKillRequirement(20, 2), enemyTypes: ['crystal_golem', 'desert_bandit'] },
      { level: 3, enemyMultiplier: 33.5, xpMultiplier: 28.5, requiredKills: calculateKillRequirement(20, 3), enemyTypes: ['desert_bandit', 'sand_scorpion'] },
      { level: 4, enemyMultiplier: 34.0, xpMultiplier: 29.0, requiredKills: calculateKillRequirement(20, 4), enemyTypes: ['fire_elemental'] },
      { level: 5, enemyMultiplier: 34.5, xpMultiplier: 29.5, requiredKills: calculateKillRequirement(20, 5), enemyTypes: ['crystal_golem'] }
    ]
  },

  // Mountain Peaks (Zones 21-30)
  {
    id: 21,
    name: 'Foothills Pass',
    theme: 'mountain',
    description: 'Rocky passes leading into the treacherous mountain peaks.',
    minPlayerLevel: 1200,
    maxPlayerLevel: 6300,
    unlockRequirement: { previousZone: 20 },
    levels: [
      { level: 1, enemyMultiplier: 35.0, xpMultiplier: 30.0, requiredKills: calculateKillRequirement(21, 1), enemyTypes: ['mountain_orc'] },
      { level: 2, enemyMultiplier: 36.0, xpMultiplier: 31.0, requiredKills: calculateKillRequirement(21, 2), enemyTypes: ['mountain_orc', 'wind_eagle'] },
      { level: 3, enemyMultiplier: 37.0, xpMultiplier: 32.0, requiredKills: calculateKillRequirement(21, 3), enemyTypes: ['wind_eagle'] },
      { level: 4, enemyMultiplier: 38.0, xpMultiplier: 33.0, requiredKills: calculateKillRequirement(21, 4), enemyTypes: ['wind_eagle', 'ice_troll'] },
      { level: 5, enemyMultiplier: 39.0, xpMultiplier: 34.0, requiredKills: calculateKillRequirement(21, 5), enemyTypes: ['ice_troll'] }
    ]
  },
  {
    id: 22,
    name: 'Frozen Peaks',
    theme: 'mountain',
    description: 'Ice-covered peaks where the cold can freeze the soul.',
    minPlayerLevel: 1300,
    maxPlayerLevel: 6600,
    unlockRequirement: { previousZone: 21 },
    levels: [
      { level: 1, enemyMultiplier: 40.0, xpMultiplier: 35.0, requiredKills: calculateKillRequirement(22, 1), enemyTypes: ['ice_troll'] },
      { level: 2, enemyMultiplier: 41.0, xpMultiplier: 36.0, requiredKills: calculateKillRequirement(22, 2), enemyTypes: ['ice_troll', 'mountain_orc'] },
      { level: 3, enemyMultiplier: 42.0, xpMultiplier: 37.0, requiredKills: calculateKillRequirement(22, 3), enemyTypes: ['mountain_orc', 'stone_giant'] },
      { level: 4, enemyMultiplier: 43.0, xpMultiplier: 38.0, requiredKills: calculateKillRequirement(22, 4), enemyTypes: ['stone_giant'] },
      { level: 5, enemyMultiplier: 44.0, xpMultiplier: 39.0, requiredKills: calculateKillRequirement(22, 5), enemyTypes: ['ice_troll'] }
    ]
  },
  {
    id: 23,
    name: 'Stone Giants Valley',
    theme: 'mountain',
    description: 'Valley of the ancient stone giants.',
    minPlayerLevel: 1400,
    maxPlayerLevel: 6900,
    unlockRequirement: { previousZone: 22 },
    levels: [
      { level: 1, enemyMultiplier: 45.0, xpMultiplier: 40.0, requiredKills: calculateKillRequirement(23, 1), enemyTypes: ['stone_giant'] },
      { level: 2, enemyMultiplier: 46.0, xpMultiplier: 41.0, requiredKills: calculateKillRequirement(23, 2), enemyTypes: ['stone_giant', 'wind_eagle'] },
      { level: 3, enemyMultiplier: 47.0, xpMultiplier: 42.0, requiredKills: calculateKillRequirement(23, 3), enemyTypes: ['wind_eagle', 'ice_troll'] },
      { level: 4, enemyMultiplier: 48.0, xpMultiplier: 43.0, requiredKills: calculateKillRequirement(23, 4), enemyTypes: ['ice_troll'] },
      { level: 5, enemyMultiplier: 49.0, xpMultiplier: 44.0, requiredKills: calculateKillRequirement(23, 5), enemyTypes: ['stone_giant'] }
    ]
  },
  {
    id: 24,
    name: 'Wind Castle',
    theme: 'mountain',
    description: 'Ancient castle built where the winds converge.',
    minPlayerLevel: 1500,
    maxPlayerLevel: 7200,
    unlockRequirement: { previousZone: 23 },
    levels: [
      { level: 1, enemyMultiplier: 50.0, xpMultiplier: 45.0, requiredKills: calculateKillRequirement(24, 1), enemyTypes: ['wind_eagle'] },
      { level: 2, enemyMultiplier: 51.0, xpMultiplier: 46.0, requiredKills: calculateKillRequirement(24, 2), enemyTypes: ['wind_eagle', 'mountain_orc'] },
      { level: 3, enemyMultiplier: 52.0, xpMultiplier: 47.0, requiredKills: calculateKillRequirement(24, 3), enemyTypes: ['mountain_orc', 'stone_giant'] },
      { level: 4, enemyMultiplier: 53.0, xpMultiplier: 48.0, requiredKills: calculateKillRequirement(24, 4), enemyTypes: ['stone_giant'] },
      { level: 5, enemyMultiplier: 54.0, xpMultiplier: 49.0, requiredKills: calculateKillRequirement(24, 5), enemyTypes: ['wind_eagle'] }
    ]
  },
  {
    id: 25,
    name: 'Glacial Cavern',
    theme: 'mountain',
    description: 'Deep ice caves within the mountain.',
    minPlayerLevel: 1600,
    maxPlayerLevel: 7500,
    unlockRequirement: { previousZone: 24 },
    levels: [
      { level: 1, enemyMultiplier: 55.0, xpMultiplier: 50.0, requiredKills: calculateKillRequirement(25, 1), enemyTypes: ['ice_troll', 'mountain_orc'] },
      { level: 2, enemyMultiplier: 56.0, xpMultiplier: 51.0, requiredKills: calculateKillRequirement(25, 2), enemyTypes: ['mountain_orc', 'stone_giant'] },
      { level: 3, enemyMultiplier: 57.0, xpMultiplier: 52.0, requiredKills: calculateKillRequirement(25, 3), enemyTypes: ['stone_giant'] },
      { level: 4, enemyMultiplier: 58.0, xpMultiplier: 53.0, requiredKills: calculateKillRequirement(25, 4), enemyTypes: ['stone_giant', 'ice_troll'] },
      { level: 5, enemyMultiplier: 59.0, xpMultiplier: 54.0, requiredKills: calculateKillRequirement(25, 5), enemyTypes: ['ice_troll'] }
    ]
  },
  {
    id: 26,
    name: 'Summit of Storms',
    theme: 'mountain',
    description: 'The peak where lightning strikes endlessly.',
    minPlayerLevel: 1700,
    maxPlayerLevel: 7800,
    unlockRequirement: { previousZone: 25 },
    levels: [
      { level: 1, enemyMultiplier: 60.0, xpMultiplier: 55.0, requiredKills: calculateKillRequirement(26, 1), enemyTypes: ['wind_eagle', 'stone_giant'] },
      { level: 2, enemyMultiplier: 61.0, xpMultiplier: 56.0, requiredKills: calculateKillRequirement(26, 2), enemyTypes: ['stone_giant', 'ice_troll'] },
      { level: 3, enemyMultiplier: 62.0, xpMultiplier: 57.0, requiredKills: calculateKillRequirement(26, 3), enemyTypes: ['ice_troll', 'mountain_orc'] },
      { level: 4, enemyMultiplier: 63.0, xpMultiplier: 58.0, requiredKills: calculateKillRequirement(26, 4), enemyTypes: ['mountain_orc'] },
      { level: 5, enemyMultiplier: 64.0, xpMultiplier: 59.0, requiredKills: calculateKillRequirement(26, 5), enemyTypes: ['wind_eagle'] }
    ]
  },
  {
    id: 27,
    name: 'Titan Throne',
    theme: 'mountain',
    description: 'Ancient throne of the mountain titans.',
    minPlayerLevel: 1800,
    maxPlayerLevel: 8100,
    unlockRequirement: { previousZone: 26 },
    levels: [
      { level: 1, enemyMultiplier: 65.0, xpMultiplier: 60.0, requiredKills: calculateKillRequirement(27, 1), enemyTypes: ['stone_giant'] },
      { level: 2, enemyMultiplier: 66.0, xpMultiplier: 61.0, requiredKills: calculateKillRequirement(27, 2), enemyTypes: ['stone_giant', 'ice_troll'] },
      { level: 3, enemyMultiplier: 67.0, xpMultiplier: 62.0, requiredKills: calculateKillRequirement(27, 3), enemyTypes: ['ice_troll', 'wind_eagle'] },
      { level: 4, enemyMultiplier: 68.0, xpMultiplier: 63.0, requiredKills: calculateKillRequirement(27, 4), enemyTypes: ['wind_eagle'] },
      { level: 5, enemyMultiplier: 69.0, xpMultiplier: 64.0, requiredKills: calculateKillRequirement(27, 5), enemyTypes: ['stone_giant'] }
    ]
  },
  {
    id: 28,
    name: 'Crystal Peak',
    theme: 'mountain',
    description: 'A mountain made entirely of magical crystal.',
    minPlayerLevel: 1900,
    maxPlayerLevel: 8400,
    unlockRequirement: { previousZone: 27 },
    levels: [
      { level: 1, enemyMultiplier: 70.0, xpMultiplier: 65.0, requiredKills: calculateKillRequirement(28, 1), enemyTypes: ['stone_giant', 'wind_eagle'] },
      { level: 2, enemyMultiplier: 71.0, xpMultiplier: 66.0, requiredKills: calculateKillRequirement(28, 2), enemyTypes: ['wind_eagle', 'ice_troll'] },
      { level: 3, enemyMultiplier: 72.0, xpMultiplier: 67.0, requiredKills: calculateKillRequirement(28, 3), enemyTypes: ['ice_troll'] },
      { level: 4, enemyMultiplier: 73.0, xpMultiplier: 68.0, requiredKills: calculateKillRequirement(28, 4), enemyTypes: ['ice_troll', 'mountain_orc'] },
      { level: 5, enemyMultiplier: 74.0, xpMultiplier: 69.0, requiredKills: calculateKillRequirement(28, 5), enemyTypes: ['stone_giant'] }
    ]
  },
  {
    id: 29,
    name: 'Sky Bridge',
    theme: 'mountain',
    description: 'A bridge connecting the highest peaks.',
    minPlayerLevel: 2000,
    maxPlayerLevel: 8700,
    unlockRequirement: { previousZone: 28 },
    levels: [
      { level: 1, enemyMultiplier: 75.0, xpMultiplier: 70.0, requiredKills: calculateKillRequirement(29, 1), enemyTypes: ['wind_eagle'] },
      { level: 2, enemyMultiplier: 76.0, xpMultiplier: 71.0, requiredKills: calculateKillRequirement(29, 2), enemyTypes: ['wind_eagle', 'stone_giant'] },
      { level: 3, enemyMultiplier: 77.0, xpMultiplier: 72.0, requiredKills: calculateKillRequirement(29, 3), enemyTypes: ['stone_giant', 'ice_troll'] },
      { level: 4, enemyMultiplier: 78.0, xpMultiplier: 73.0, requiredKills: calculateKillRequirement(29, 4), enemyTypes: ['ice_troll'] },
      { level: 5, enemyMultiplier: 79.0, xpMultiplier: 74.0, requiredKills: calculateKillRequirement(29, 5), enemyTypes: ['wind_eagle'] }
    ]
  },
  {
    id: 30,
    name: 'World Peak',
    theme: 'mountain',
    description: 'The highest mountain peak, touching the heavens.',
    minPlayerLevel: 2100,
    maxPlayerLevel: 9000,
    unlockRequirement: { previousZone: 29 },
    levels: [
      { level: 1, enemyMultiplier: 80.0, xpMultiplier: 75.0, requiredKills: calculateKillRequirement(30, 1), enemyTypes: ['stone_giant', 'wind_eagle'] },
      { level: 2, enemyMultiplier: 81.0, xpMultiplier: 76.0, requiredKills: calculateKillRequirement(30, 2), enemyTypes: ['wind_eagle', 'ice_troll'] },
      { level: 3, enemyMultiplier: 82.0, xpMultiplier: 77.0, requiredKills: calculateKillRequirement(30, 3), enemyTypes: ['ice_troll', 'mountain_orc'] },
      { level: 4, enemyMultiplier: 83.0, xpMultiplier: 78.0, requiredKills: calculateKillRequirement(30, 4), enemyTypes: ['mountain_orc'] },
      { level: 5, enemyMultiplier: 84.0, xpMultiplier: 79.0, requiredKills: calculateKillRequirement(30, 5), enemyTypes: ['stone_giant'] }
    ]
  },

  // Underground Depths (Zones 31-40)
  {
    id: 31,
    name: 'Cavern Entrance',
    theme: 'underground',
    description: 'Dark caverns that delve deep beneath the earth.',
    minPlayerLevel: 2200,
    maxPlayerLevel: 9300,
    unlockRequirement: { previousZone: 30 },
    levels: [
      { level: 1, enemyMultiplier: 85.0, xpMultiplier: 80.0, requiredKills: calculateKillRequirement(31, 1), enemyTypes: ['cave_spider'] },
      { level: 2, enemyMultiplier: 86.0, xpMultiplier: 81.0, requiredKills: calculateKillRequirement(31, 2), enemyTypes: ['cave_spider', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 87.0, xpMultiplier: 82.0, requiredKills: calculateKillRequirement(31, 3), enemyTypes: ['shadow_bat'] },
      { level: 4, enemyMultiplier: 88.0, xpMultiplier: 83.0, requiredKills: calculateKillRequirement(31, 4), enemyTypes: ['shadow_bat', 'lava_demon'] },
      { level: 5, enemyMultiplier: 89.0, xpMultiplier: 84.0, requiredKills: calculateKillRequirement(31, 5), enemyTypes: ['lava_demon'] }
    ]
  },
  {
    id: 32,
    name: 'Spider Tunnels',
    theme: 'underground',
    description: 'Tunnel networks crawling with giant spiders.',
    minPlayerLevel: 2300,
    maxPlayerLevel: 9600,
    unlockRequirement: { previousZone: 31 },
    levels: [
      { level: 1, enemyMultiplier: 90.0, xpMultiplier: 85.0, requiredKills: calculateKillRequirement(32, 1), enemyTypes: ['cave_spider'] },
      { level: 2, enemyMultiplier: 91.0, xpMultiplier: 86.0, requiredKills: calculateKillRequirement(32, 2), enemyTypes: ['cave_spider', 'crystal_wraith'] },
      { level: 3, enemyMultiplier: 92.0, xpMultiplier: 87.0, requiredKills: calculateKillRequirement(32, 3), enemyTypes: ['crystal_wraith'] },
      { level: 4, enemyMultiplier: 93.0, xpMultiplier: 88.0, requiredKills: calculateKillRequirement(32, 4), enemyTypes: ['crystal_wraith', 'shadow_bat'] },
      { level: 5, enemyMultiplier: 94.0, xpMultiplier: 89.0, requiredKills: calculateKillRequirement(32, 5), enemyTypes: ['cave_spider'] }
    ]
  },
  {
    id: 33,
    name: 'Bat Colonies',
    theme: 'underground',
    description: 'Vast chambers where shadow bats nest.',
    minPlayerLevel: 2400,
    maxPlayerLevel: 9900,
    unlockRequirement: { previousZone: 32 },
    levels: [
      { level: 1, enemyMultiplier: 95.0, xpMultiplier: 90.0, requiredKills: calculateKillRequirement(33, 1), enemyTypes: ['shadow_bat'] },
      { level: 2, enemyMultiplier: 96.0, xpMultiplier: 91.0, requiredKills: calculateKillRequirement(33, 2), enemyTypes: ['shadow_bat', 'lava_demon'] },
      { level: 3, enemyMultiplier: 97.0, xpMultiplier: 92.0, requiredKills: calculateKillRequirement(33, 3), enemyTypes: ['lava_demon'] },
      { level: 4, enemyMultiplier: 98.0, xpMultiplier: 93.0, requiredKills: calculateKillRequirement(33, 4), enemyTypes: ['lava_demon', 'cave_spider'] },
      { level: 5, enemyMultiplier: 99.0, xpMultiplier: 94.0, requiredKills: calculateKillRequirement(33, 5), enemyTypes: ['shadow_bat'] }
    ]
  },
  {
    id: 34,
    name: 'Lava Chambers',
    theme: 'underground',
    description: 'Chambers filled with molten lava and demons.',
    minPlayerLevel: 2500,
    maxPlayerLevel: 10200,
    unlockRequirement: { previousZone: 33 },
    levels: [
      { level: 1, enemyMultiplier: 100.0, xpMultiplier: 95.0, requiredKills: calculateKillRequirement(34, 1), enemyTypes: ['lava_demon'] },
      { level: 2, enemyMultiplier: 101.0, xpMultiplier: 96.0, requiredKills: calculateKillRequirement(34, 2), enemyTypes: ['lava_demon', 'crystal_wraith'] },
      { level: 3, enemyMultiplier: 102.0, xpMultiplier: 97.0, requiredKills: calculateKillRequirement(34, 3), enemyTypes: ['crystal_wraith', 'cave_spider'] },
      { level: 4, enemyMultiplier: 103.0, xpMultiplier: 98.0, requiredKills: calculateKillRequirement(34, 4), enemyTypes: ['cave_spider'] },
      { level: 5, enemyMultiplier: 104.0, xpMultiplier: 99.0, requiredKills: calculateKillRequirement(34, 5), enemyTypes: ['lava_demon'] }
    ]
  },
  {
    id: 35,
    name: 'Crystal Gardens',
    theme: 'underground',
    description: 'Underground gardens of living crystal.',
    minPlayerLevel: 2600,
    maxPlayerLevel: 10500,
    unlockRequirement: { previousZone: 34 },
    levels: [
      { level: 1, enemyMultiplier: 105.0, xpMultiplier: 100.0, requiredKills: calculateKillRequirement(35, 1), enemyTypes: ['crystal_wraith'] },
      { level: 2, enemyMultiplier: 106.0, xpMultiplier: 101.0, requiredKills: calculateKillRequirement(35, 2), enemyTypes: ['crystal_wraith', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 107.0, xpMultiplier: 102.0, requiredKills: calculateKillRequirement(35, 3), enemyTypes: ['shadow_bat', 'lava_demon'] },
      { level: 4, enemyMultiplier: 108.0, xpMultiplier: 103.0, requiredKills: calculateKillRequirement(35, 4), enemyTypes: ['lava_demon'] },
      { level: 5, enemyMultiplier: 109.0, xpMultiplier: 104.0, requiredKills: calculateKillRequirement(35, 5), enemyTypes: ['crystal_wraith'] }
    ]
  },
  {
    id: 36,
    name: 'Demon Fortress',
    theme: 'underground',
    description: 'Ancient fortress ruled by lava demons.',
    minPlayerLevel: 2700,
    maxPlayerLevel: 10800,
    unlockRequirement: { previousZone: 35 },
    levels: [
      { level: 1, enemyMultiplier: 110.0, xpMultiplier: 105.0, requiredKills: calculateKillRequirement(36, 1), enemyTypes: ['lava_demon', 'cave_spider'] },
      { level: 2, enemyMultiplier: 111.0, xpMultiplier: 106.0, requiredKills: calculateKillRequirement(36, 2), enemyTypes: ['cave_spider', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 112.0, xpMultiplier: 107.0, requiredKills: calculateKillRequirement(36, 3), enemyTypes: ['shadow_bat', 'crystal_wraith'] },
      { level: 4, enemyMultiplier: 113.0, xpMultiplier: 108.0, requiredKills: calculateKillRequirement(36, 4), enemyTypes: ['crystal_wraith'] },
      { level: 5, enemyMultiplier: 114.0, xpMultiplier: 109.0, requiredKills: calculateKillRequirement(36, 5), enemyTypes: ['lava_demon'] }
    ]
  },
  {
    id: 37,
    name: 'Shadow Realm Gate',
    theme: 'underground',
    description: 'Gateway between the physical and shadow realms.',
    minPlayerLevel: 2800,
    maxPlayerLevel: 11100,
    unlockRequirement: { previousZone: 36 },
    levels: [
      { level: 1, enemyMultiplier: 115.0, xpMultiplier: 110.0, requiredKills: calculateKillRequirement(37, 1), enemyTypes: ['shadow_bat', 'crystal_wraith'] },
      { level: 2, enemyMultiplier: 116.0, xpMultiplier: 111.0, requiredKills: calculateKillRequirement(37, 2), enemyTypes: ['crystal_wraith', 'lava_demon'] },
      { level: 3, enemyMultiplier: 117.0, xpMultiplier: 112.0, requiredKills: calculateKillRequirement(37, 3), enemyTypes: ['lava_demon', 'cave_spider'] },
      { level: 4, enemyMultiplier: 118.0, xpMultiplier: 113.0, requiredKills: calculateKillRequirement(37, 4), enemyTypes: ['cave_spider'] },
      { level: 5, enemyMultiplier: 119.0, xpMultiplier: 114.0, requiredKills: calculateKillRequirement(37, 5), enemyTypes: ['shadow_bat'] }
    ]
  },
  {
    id: 38,
    name: 'Abyssal Depths',
    theme: 'underground',
    description: 'The deepest caverns where darkness reigns supreme.',
    minPlayerLevel: 2900,
    maxPlayerLevel: 11400,
    unlockRequirement: { previousZone: 37 },
    levels: [
      { level: 1, enemyMultiplier: 120.0, xpMultiplier: 115.0, requiredKills: calculateKillRequirement(38, 1), enemyTypes: ['crystal_wraith', 'lava_demon'] },
      { level: 2, enemyMultiplier: 121.0, xpMultiplier: 116.0, requiredKills: calculateKillRequirement(38, 2), enemyTypes: ['lava_demon', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 122.0, xpMultiplier: 117.0, requiredKills: calculateKillRequirement(38, 3), enemyTypes: ['shadow_bat', 'cave_spider'] },
      { level: 4, enemyMultiplier: 123.0, xpMultiplier: 118.0, requiredKills: calculateKillRequirement(38, 4), enemyTypes: ['cave_spider'] },
      { level: 5, enemyMultiplier: 124.0, xpMultiplier: 119.0, requiredKills: calculateKillRequirement(38, 5), enemyTypes: ['crystal_wraith'] }
    ]
  },
  {
    id: 39,
    name: 'Core of Darkness',
    theme: 'underground',
    description: 'The very core of the underground realm.',
    minPlayerLevel: 3000,
    maxPlayerLevel: 11700,
    unlockRequirement: { previousZone: 38 },
    levels: [
      { level: 1, enemyMultiplier: 125.0, xpMultiplier: 120.0, requiredKills: calculateKillRequirement(39, 1), enemyTypes: ['lava_demon', 'crystal_wraith'] },
      { level: 2, enemyMultiplier: 126.0, xpMultiplier: 121.0, requiredKills: calculateKillRequirement(39, 2), enemyTypes: ['crystal_wraith', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 127.0, xpMultiplier: 122.0, requiredKills: calculateKillRequirement(39, 3), enemyTypes: ['shadow_bat'] },
      { level: 4, enemyMultiplier: 128.0, xpMultiplier: 123.0, requiredKills: calculateKillRequirement(39, 4), enemyTypes: ['shadow_bat', 'cave_spider'] },
      { level: 5, enemyMultiplier: 129.0, xpMultiplier: 124.0, requiredKills: calculateKillRequirement(39, 5), enemyTypes: ['lava_demon'] }
    ]
  },
  {
    id: 40,
    name: 'Underworld Nexus',
    theme: 'underground',
    description: 'The nexus connecting all underground realms.',
    minPlayerLevel: 3100,
    maxPlayerLevel: 12000,
    unlockRequirement: { previousZone: 39 },
    levels: [
      { level: 1, enemyMultiplier: 130.0, xpMultiplier: 125.0, requiredKills: calculateKillRequirement(40, 1), enemyTypes: ['crystal_wraith', 'lava_demon'] },
      { level: 2, enemyMultiplier: 131.0, xpMultiplier: 126.0, requiredKills: calculateKillRequirement(40, 2), enemyTypes: ['lava_demon', 'shadow_bat'] },
      { level: 3, enemyMultiplier: 132.0, xpMultiplier: 127.0, requiredKills: calculateKillRequirement(40, 3), enemyTypes: ['shadow_bat', 'cave_spider'] },
      { level: 4, enemyMultiplier: 133.0, xpMultiplier: 128.0, requiredKills: calculateKillRequirement(40, 4), enemyTypes: ['cave_spider'] },
      { level: 5, enemyMultiplier: 134.0, xpMultiplier: 129.0, requiredKills: calculateKillRequirement(40, 5), enemyTypes: ['crystal_wraith'] }
    ]
  },

  // Mystical Planes (Zones 41-50)
  {
    id: 41,
    name: 'Astral Gateway',
    theme: 'mystical',
    description: 'Gateway to the mystical planes beyond reality.',
    minPlayerLevel: 3200,
    maxPlayerLevel: 12300,
    unlockRequirement: { previousZone: 40 },
    levels: [
      { level: 1, enemyMultiplier: 135.0, xpMultiplier: 130.0, requiredKills: calculateKillRequirement(41, 1), enemyTypes: ['void_stalker'] },
      { level: 2, enemyMultiplier: 136.0, xpMultiplier: 131.0, requiredKills: calculateKillRequirement(41, 2), enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 3, enemyMultiplier: 137.0, xpMultiplier: 132.0, requiredKills: calculateKillRequirement(41, 3), enemyTypes: ['celestial_guardian'] },
      { level: 4, enemyMultiplier: 138.0, xpMultiplier: 133.0, requiredKills: calculateKillRequirement(41, 4), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 5, enemyMultiplier: 139.0, xpMultiplier: 134.0, requiredKills: calculateKillRequirement(41, 5), enemyTypes: ['chaos_lord'] }
    ]
  },
  {
    id: 42,
    name: 'Void Gardens',
    theme: 'mystical',
    description: 'Gardens that exist in the spaces between reality.',
    minPlayerLevel: 3300,
    maxPlayerLevel: 12600,
    unlockRequirement: { previousZone: 41 },
    levels: [
      { level: 1, enemyMultiplier: 140.0, xpMultiplier: 135.0, requiredKills: calculateKillRequirement(42, 1), enemyTypes: ['void_stalker'] },
      { level: 2, enemyMultiplier: 141.0, xpMultiplier: 136.0, requiredKills: calculateKillRequirement(42, 2), enemyTypes: ['void_stalker', 'ancient_dragon'] },
      { level: 3, enemyMultiplier: 142.0, xpMultiplier: 137.0, requiredKills: calculateKillRequirement(42, 3), enemyTypes: ['ancient_dragon'] },
      { level: 4, enemyMultiplier: 143.0, xpMultiplier: 138.0, requiredKills: calculateKillRequirement(42, 4), enemyTypes: ['ancient_dragon', 'celestial_guardian'] },
      { level: 5, enemyMultiplier: 144.0, xpMultiplier: 139.0, requiredKills: calculateKillRequirement(42, 5), enemyTypes: ['void_stalker'] }
    ]
  },
  {
    id: 43,
    name: 'Celestial Court',
    theme: 'mystical',
    description: 'The grand court of celestial beings.',
    minPlayerLevel: 3400,
    maxPlayerLevel: 12900,
    unlockRequirement: { previousZone: 42 },
    levels: [
      { level: 1, enemyMultiplier: 145.0, xpMultiplier: 140.0, requiredKills: calculateKillRequirement(43, 1), enemyTypes: ['celestial_guardian'] },
      { level: 2, enemyMultiplier: 146.0, xpMultiplier: 141.0, requiredKills: calculateKillRequirement(43, 2), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 3, enemyMultiplier: 147.0, xpMultiplier: 142.0, requiredKills: calculateKillRequirement(43, 3), enemyTypes: ['chaos_lord'] },
      { level: 4, enemyMultiplier: 148.0, xpMultiplier: 143.0, requiredKills: calculateKillRequirement(43, 4), enemyTypes: ['chaos_lord', 'void_stalker'] },
      { level: 5, enemyMultiplier: 149.0, xpMultiplier: 144.0, requiredKills: calculateKillRequirement(43, 5), enemyTypes: ['celestial_guardian'] }
    ]
  },
  {
    id: 44,
    name: 'Chaos Realm',
    theme: 'mystical',
    description: 'Realm where chaos lords rule with iron fists.',
    minPlayerLevel: 3500,
    maxPlayerLevel: 13200,
    unlockRequirement: { previousZone: 43 },
    levels: [
      { level: 1, enemyMultiplier: 150.0, xpMultiplier: 145.0, requiredKills: calculateKillRequirement(44, 1), enemyTypes: ['chaos_lord'] },
      { level: 2, enemyMultiplier: 151.0, xpMultiplier: 146.0, requiredKills: calculateKillRequirement(44, 2), enemyTypes: ['chaos_lord', 'ancient_dragon'] },
      { level: 3, enemyMultiplier: 152.0, xpMultiplier: 147.0, requiredKills: calculateKillRequirement(44, 3), enemyTypes: ['ancient_dragon'] },
      { level: 4, enemyMultiplier: 153.0, xpMultiplier: 148.0, requiredKills: calculateKillRequirement(44, 4), enemyTypes: ['ancient_dragon', 'void_stalker'] },
      { level: 5, enemyMultiplier: 154.0, xpMultiplier: 149.0, requiredKills: calculateKillRequirement(44, 5), enemyTypes: ['chaos_lord'] }
    ]
  },
  {
    id: 45,
    name: 'Dragon Sanctum',
    theme: 'mystical',
    description: 'Sacred sanctuary of the ancient dragons.',
    minPlayerLevel: 3600,
    maxPlayerLevel: 13500,
    unlockRequirement: { previousZone: 44 },
    levels: [
      { level: 1, enemyMultiplier: 155.0, xpMultiplier: 150.0, requiredKills: calculateKillRequirement(45, 1), enemyTypes: ['ancient_dragon'] },
      { level: 2, enemyMultiplier: 156.0, xpMultiplier: 151.0, requiredKills: calculateKillRequirement(45, 2), enemyTypes: ['ancient_dragon', 'celestial_guardian'] },
      { level: 3, enemyMultiplier: 157.0, xpMultiplier: 152.0, requiredKills: calculateKillRequirement(45, 3), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 4, enemyMultiplier: 158.0, xpMultiplier: 153.0, requiredKills: calculateKillRequirement(45, 4), enemyTypes: ['chaos_lord'] },
      { level: 5, enemyMultiplier: 159.0, xpMultiplier: 154.0, requiredKills: calculateKillRequirement(45, 5), enemyTypes: ['ancient_dragon'] }
    ]
  },
  {
    id: 46,
    name: 'Void Citadel',
    theme: 'mystical',
    description: 'Fortress floating in the endless void.',
    minPlayerLevel: 3700,
    maxPlayerLevel: 13800,
    unlockRequirement: { previousZone: 45 },
    levels: [
      { level: 1, enemyMultiplier: 160.0, xpMultiplier: 155.0, requiredKills: calculateKillRequirement(46, 1), enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 2, enemyMultiplier: 162.0, xpMultiplier: 157.0, requiredKills: calculateKillRequirement(46, 2), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 3, enemyMultiplier: 164.0, xpMultiplier: 159.0, requiredKills: calculateKillRequirement(46, 3), enemyTypes: ['chaos_lord', 'ancient_dragon'] },
      { level: 4, enemyMultiplier: 166.0, xpMultiplier: 161.0, requiredKills: calculateKillRequirement(46, 4), enemyTypes: ['ancient_dragon'] },
      { level: 5, enemyMultiplier: 168.0, xpMultiplier: 163.0, requiredKills: calculateKillRequirement(46, 5), enemyTypes: ['void_stalker'] }
    ]
  },
  {
    id: 47,
    name: 'Realm of Dreams',
    theme: 'mystical',
    description: 'A realm where dreams and nightmares take physical form.',
    minPlayerLevel: 3800,
    maxPlayerLevel: 14100,
    unlockRequirement: { previousZone: 46 },
    levels: [
      { level: 1, enemyMultiplier: 170.0, xpMultiplier: 165.0, requiredKills: calculateKillRequirement(47, 1), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 2, enemyMultiplier: 172.0, xpMultiplier: 167.0, requiredKills: calculateKillRequirement(47, 2), enemyTypes: ['chaos_lord', 'ancient_dragon'] },
      { level: 3, enemyMultiplier: 174.0, xpMultiplier: 169.0, requiredKills: calculateKillRequirement(47, 3), enemyTypes: ['ancient_dragon', 'void_stalker'] },
      { level: 4, enemyMultiplier: 176.0, xpMultiplier: 171.0, requiredKills: calculateKillRequirement(47, 4), enemyTypes: ['void_stalker'] },
      { level: 5, enemyMultiplier: 178.0, xpMultiplier: 173.0, requiredKills: calculateKillRequirement(47, 5), enemyTypes: ['celestial_guardian'] }
    ]
  },
  {
    id: 48,
    name: 'Time Vortex',
    theme: 'mystical',
    description: 'A swirling vortex where time flows differently.',
    minPlayerLevel: 3900,
    maxPlayerLevel: 14400,
    unlockRequirement: { previousZone: 47 },
    levels: [
      { level: 1, enemyMultiplier: 180.0, xpMultiplier: 175.0, requiredKills: calculateKillRequirement(48, 1), enemyTypes: ['chaos_lord', 'ancient_dragon'] },
      { level: 2, enemyMultiplier: 182.0, xpMultiplier: 177.0, requiredKills: calculateKillRequirement(48, 2), enemyTypes: ['ancient_dragon', 'void_stalker'] },
      { level: 3, enemyMultiplier: 184.0, xpMultiplier: 179.0, requiredKills: calculateKillRequirement(48, 3), enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 4, enemyMultiplier: 186.0, xpMultiplier: 181.0, requiredKills: calculateKillRequirement(48, 4), enemyTypes: ['celestial_guardian'] },
      { level: 5, enemyMultiplier: 188.0, xpMultiplier: 183.0, requiredKills: calculateKillRequirement(48, 5), enemyTypes: ['chaos_lord'] }
    ]
  },
  {
    id: 49,
    name: 'Reality Forge',
    theme: 'mystical',
    description: 'The forge where reality itself is shaped.',
    minPlayerLevel: 4000,
    maxPlayerLevel: 14700,
    unlockRequirement: { previousZone: 48 },
    levels: [
      { level: 1, enemyMultiplier: 190.0, xpMultiplier: 185.0, requiredKills: calculateKillRequirement(49, 1), enemyTypes: ['ancient_dragon', 'void_stalker'] },
      { level: 2, enemyMultiplier: 192.0, xpMultiplier: 187.0, requiredKills: calculateKillRequirement(49, 2), enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 3, enemyMultiplier: 194.0, xpMultiplier: 189.0, requiredKills: calculateKillRequirement(49, 3), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 4, enemyMultiplier: 196.0, xpMultiplier: 191.0, requiredKills: calculateKillRequirement(49, 4), enemyTypes: ['chaos_lord'] },
      { level: 5, enemyMultiplier: 198.0, xpMultiplier: 193.0, requiredKills: calculateKillRequirement(49, 5), enemyTypes: ['ancient_dragon'] }
    ]
  },
  {
    id: 50,
    name: 'Nexus of Eternity',
    theme: 'mystical',
    description: 'Where reality bends to cosmic forces',
    minPlayerLevel: 4100,
    maxPlayerLevel: 15000,
    unlockRequirement: { previousZone: 49, bossDefeated: true },
    levels: [
      { level: 1, enemyMultiplier: 200.0, xpMultiplier: 195.0, requiredKills: calculateKillRequirement(50, 1), enemyTypes: ['void_stalker'] },
      { level: 2, enemyMultiplier: 205.0, xpMultiplier: 200.0, requiredKills: calculateKillRequirement(50, 2), enemyTypes: ['void_stalker', 'celestial_guardian'] },
      { level: 3, enemyMultiplier: 210.0, xpMultiplier: 205.0, requiredKills: calculateKillRequirement(50, 3), enemyTypes: ['celestial_guardian', 'chaos_lord'] },
      { level: 4, enemyMultiplier: 215.0, xpMultiplier: 210.0, requiredKills: calculateKillRequirement(50, 4), enemyTypes: ['chaos_lord'] },
      { level: 5, enemyMultiplier: 220.0, xpMultiplier: 215.0, requiredKills: calculateKillRequirement(50, 5), enemyTypes: ['ancient_dragon'] }
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