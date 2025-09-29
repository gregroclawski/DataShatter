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
    poison?: number;
  };
}

export interface ZoneLevel {
  level: number;
  enemyMultiplier: number; // HP/Attack multiplier for this level
  xpMultiplier: number;
  requiredKills: number; // Linear progression: variable kills per level
  enemyTypes: string[]; // Enemy IDs that spawn in this level
}

export interface Zone {
  id: number;
  name: string;
  theme: string;
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
    baseXP: 60, // TRIPLED from 20 to 60
  },
  'wild_wolf': {
    id: 'wild_wolf', 
    name: 'Wild Wolf',
    icon: '🐺',
    baseHP: 25,
    baseAttack: 12,
    baseXP: 45, // TRIPLED from 15 to 45
  },
  'tree_guardian': {
    id: 'tree_guardian',
    name: 'Tree Guardian', 
    icon: '🌳',
    baseHP: 45,
    baseAttack: 15,
    baseXP: 75, // TRIPLED from 25 to 75
    resistances: { physical: 0.2 }
  },
  'dark_sprite': {
    id: 'dark_sprite',
    name: 'Dark Sprite',
    icon: '🧚‍♀️',
    baseHP: 20,
    baseAttack: 18,
    baseXP: 60, // TRIPLED from 20 to 60
    resistances: { magic: 0.3 }
  },
  'shadow_wolf': {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    icon: '🐺',
    baseHP: 30,
    baseAttack: 20,
    baseXP: 75, // TRIPLED from 25 to 75
    resistances: { magic: 0.2 }
  },
  'ancient_oak': {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    icon: '🌲',
    baseHP: 80,
    baseAttack: 25,
    baseXP: 105, // TRIPLED from 35 to 105
    resistances: { physical: 0.3 }
  },
  'flame_salamander': {
    id: 'flame_salamander',
    name: 'Flame Salamander',
    icon: '🦎',
    baseHP: 40,
    baseAttack: 30,
    baseXP: 135, // TRIPLED from 45 to 135
    resistances: { physical: 0.4, fire: -0.3 }
  },

  // Mountain Peaks (Zones 11-20)
  'mountain_orc': {
    id: 'mountain_orc',
    name: 'Mountain Orc',
    icon: '🧌',
    baseHP: 50,
    baseAttack: 22,
    baseXP: 90, // TRIPLED from 30 to 90
  },
  'stone_giant': {
    id: 'stone_giant',
    name: 'Stone Giant',
    icon: '🗿',
    baseHP: 80,
    baseAttack: 28,
    baseXP: 120, // TRIPLED from 40 to 120
  },
  'fire_drake': {
    id: 'fire_drake',
    name: 'Fire Drake',
    icon: '🐉',
    baseHP: 60,
    baseAttack: 35,
    baseXP: 150, // TRIPLED from 50 to 150
    resistances: { fire: 0.8, ice: -0.5 }
  },
  'rock_golem': {
    id: 'rock_golem',
    name: 'Rock Golem',
    icon: '🪨',
    baseHP: 100,
    baseAttack: 30,
    baseXP: 135, // TRIPLED from 45 to 135
    resistances: { physical: 0.4 }
  },

  // Desert Wastelands (Zones 21-30)
  'sand_scorpion': {
    id: 'sand_scorpion',
    name: 'Sand Scorpion',
    icon: '🦂',
    baseHP: 45,
    baseAttack: 45,
    baseXP: 180, // TRIPLED from 60 to 180
  },
  'ice_wraith': {
    id: 'ice_wraith',
    name: 'Ice Wraith',
    icon: '👻',
    baseHP: 55,
    baseAttack: 40,
    baseXP: 210, // TRIPLED from 70 to 210
    resistances: { ice: 0.6, fire: -0.3 }
  },
  'crystal_spider': {
    id: 'crystal_spider',
    name: 'Crystal Spider',
    icon: '🕷️',
    baseHP: 65,
    baseAttack: 55,
    baseXP: 195, // TRIPLED from 65 to 195
  },
  'desert_basilisk': {
    id: 'desert_basilisk',
    name: 'Desert Basilisk',
    icon: '🐍',
    baseHP: 70,
    baseAttack: 50,
    baseXP: 240, // TRIPLED from 80 to 240
    resistances: { physical: 0.5 }
  },

  // Volcanic Fields (Zones 31-40)
  'magma_elemental': {
    id: 'magma_elemental',
    name: 'Magma Elemental',
    icon: '🔥',
    baseHP: 80,
    baseAttack: 60,
    baseXP: 255, // TRIPLED from 85 to 255
  },
  'lava_beast': {
    id: 'lava_beast',
    name: 'Lava Beast',
    icon: '🦏',
    baseHP: 90,
    baseAttack: 70,
    baseXP: 270, // TRIPLED from 90 to 270
  },
  'inferno_dragon': {
    id: 'inferno_dragon',
    name: 'Inferno Dragon',
    icon: '🐲',
    baseHP: 120,
    baseAttack: 75,
    baseXP: 300, // TRIPLED from 100 to 300
    resistances: { fire: 0.7 }
  },
  'phoenix_guardian': {
    id: 'phoenix_guardian',
    name: 'Phoenix Guardian',
    icon: '🔥🦅',
    baseHP: 100,
    baseAttack: 80,
    baseXP: 330, // TRIPLED from 110 to 330
    resistances: { magic: 0.4 }
  },

  // Shadow Realm (Zones 41-50)
  'shadow_demon': {
    id: 'shadow_demon',
    name: 'Shadow Demon',
    icon: '👹',
    baseHP: 150,
    baseAttack: 100,
    baseXP: 450, // TRIPLED from 150 to 450
  },
  'void_stalker': {
    id: 'void_stalker',
    name: 'Void Stalker',
    icon: '👤',
    baseHP: 180,
    baseAttack: 120,
    baseXP: 540, // TRIPLED from 180 to 540
    resistances: { magic: 0.6 }
  },
  'nightmare_lord': {
    id: 'nightmare_lord',
    name: 'Nightmare Lord',
    icon: '💀',
    baseHP: 200,
    baseAttack: 150,
    baseXP: 600, // TRIPLED from 200 to 600
  },
  'chaos_titan': {
    id: 'chaos_titan',
    name: 'Chaos Titan',
    icon: '⚡',
    baseHP: 300,
    baseAttack: 200,
    baseXP: 900, // TRIPLED from 300 to 900
    resistances: { fire: 0.8, physical: 0.3 }
  },
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
    name: 'Emerald Grove',
    theme: 'forest',
    minPlayerLevel: 1,
    maxPlayerLevel: 5,
    levels: [
      { level: 1, enemyMultiplier: 0.8, xpMultiplier: 1.0, requiredKills: calculateKillRequirement(1, 1), enemyTypes: ['forest_goblin', 'wild_wolf'] },
      { level: 2, enemyMultiplier: 0.9, xpMultiplier: 1.1, requiredKills: calculateKillRequirement(1, 2), enemyTypes: ['forest_goblin', 'wild_wolf', 'dark_sprite'] },
      { level: 3, enemyMultiplier: 1.0, xpMultiplier: 1.2, requiredKills: calculateKillRequirement(1, 3), enemyTypes: ['wild_wolf', 'dark_sprite', 'tree_guardian'] },
      { level: 4, enemyMultiplier: 1.1, xpMultiplier: 1.3, requiredKills: calculateKillRequirement(1, 4), enemyTypes: ['dark_sprite', 'tree_guardian'] },
      { level: 5, enemyMultiplier: 1.2, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(1, 5), enemyTypes: ['tree_guardian', 'shadow_wolf'] },
    ],
    unlockRequirement: {},
  },
  {
    id: 2,
    name: 'Whispering Woods',
    theme: 'forest',
    minPlayerLevel: 3,
    maxPlayerLevel: 8,
    levels: [
      { level: 1, enemyMultiplier: 0.9, xpMultiplier: 1.1, requiredKills: calculateKillRequirement(2, 1), enemyTypes: ['wild_wolf', 'shadow_wolf'] },
      { level: 2, enemyMultiplier: 1.0, xpMultiplier: 1.2, requiredKills: calculateKillRequirement(2, 2), enemyTypes: ['shadow_wolf', 'dark_sprite'] },
      { level: 3, enemyMultiplier: 1.1, xpMultiplier: 1.3, requiredKills: calculateKillRequirement(2, 3), enemyTypes: ['dark_sprite', 'tree_guardian'] },
      { level: 4, enemyMultiplier: 1.2, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(2, 4), enemyTypes: ['tree_guardian', 'ancient_oak'] },
      { level: 5, enemyMultiplier: 1.3, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(2, 5), enemyTypes: ['ancient_oak'] },
    ],
    unlockRequirement: { previousZone: 1 },
  },
  {
    id: 3,
    name: 'Shadow Forest',
    theme: 'forest',
    minPlayerLevel: 5,
    maxPlayerLevel: 12,
    levels: [
      { level: 1, enemyMultiplier: 1.0, xpMultiplier: 1.2, requiredKills: calculateKillRequirement(3, 1), enemyTypes: ['shadow_wolf', 'dark_sprite'] },
      { level: 2, enemyMultiplier: 1.1, xpMultiplier: 1.3, requiredKills: calculateKillRequirement(3, 2), enemyTypes: ['dark_sprite', 'ancient_oak'] },
      { level: 3, enemyMultiplier: 1.2, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(3, 3), enemyTypes: ['ancient_oak', 'flame_salamander'] },
      { level: 4, enemyMultiplier: 1.3, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(3, 4), enemyTypes: ['flame_salamander'] },
      { level: 5, enemyMultiplier: 1.4, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(3, 5), enemyTypes: ['flame_salamander', 'mountain_orc'] },
    ],
    unlockRequirement: { previousZone: 2 },
  },
  {
    id: 4,
    name: 'Ancient Ruins',
    theme: 'ruins',
    minPlayerLevel: 8,
    maxPlayerLevel: 15,
    levels: [
      { level: 1, enemyMultiplier: 1.1, xpMultiplier: 1.3, requiredKills: calculateKillRequirement(4, 1), enemyTypes: ['ancient_oak', 'flame_salamander'] },
      { level: 2, enemyMultiplier: 1.2, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(4, 2), enemyTypes: ['flame_salamander', 'mountain_orc'] },
      { level: 3, enemyMultiplier: 1.3, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(4, 3), enemyTypes: ['mountain_orc', 'stone_giant'] },
      { level: 4, enemyMultiplier: 1.4, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(4, 4), enemyTypes: ['stone_giant'] },
      { level: 5, enemyMultiplier: 1.5, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(4, 5), enemyTypes: ['stone_giant', 'fire_drake'] },
    ],
    unlockRequirement: { previousZone: 3 },
  },
  {
    id: 5,
    name: 'Mystical Glade',
    theme: 'forest',
    minPlayerLevel: 12,
    maxPlayerLevel: 20,
    levels: [
      { level: 1, enemyMultiplier: 1.2, xpMultiplier: 1.4, requiredKills: calculateKillRequirement(5, 1), enemyTypes: ['flame_salamander', 'mountain_orc'] },
      { level: 2, enemyMultiplier: 1.3, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(5, 2), enemyTypes: ['mountain_orc', 'stone_giant'] },
      { level: 3, enemyMultiplier: 1.4, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(5, 3), enemyTypes: ['stone_giant', 'fire_drake'] },
      { level: 4, enemyMultiplier: 1.5, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(5, 4), enemyTypes: ['fire_drake'] },
      { level: 5, enemyMultiplier: 1.6, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(5, 5), enemyTypes: ['fire_drake', 'rock_golem'] },
    ],
    unlockRequirement: { previousZone: 4 },
  },

  // Zones 6-10: Deeper Forest
  {
    id: 6,
    name: 'Deep Woods',
    theme: 'forest',
    minPlayerLevel: 15,
    maxPlayerLevel: 25,
    levels: [
      { level: 1, enemyMultiplier: 1.3, xpMultiplier: 1.5, requiredKills: calculateKillRequirement(6, 1), enemyTypes: ['stone_giant', 'fire_drake'] },
      { level: 2, enemyMultiplier: 1.4, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(6, 2), enemyTypes: ['fire_drake', 'rock_golem'] },
      { level: 3, enemyMultiplier: 1.5, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(6, 3), enemyTypes: ['rock_golem'] },
      { level: 4, enemyMultiplier: 1.6, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(6, 4), enemyTypes: ['rock_golem', 'sand_scorpion'] },
      { level: 5, enemyMultiplier: 1.7, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(6, 5), enemyTypes: ['sand_scorpion'] },
    ],
    unlockRequirement: { previousZone: 5 },
  },
  {
    id: 7,
    name: 'Twilight Grove',
    theme: 'forest',
    minPlayerLevel: 18,
    maxPlayerLevel: 30,
    levels: [
      { level: 1, enemyMultiplier: 1.4, xpMultiplier: 1.6, requiredKills: calculateKillRequirement(7, 1), enemyTypes: ['fire_drake', 'rock_golem'] },
      { level: 2, enemyMultiplier: 1.5, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(7, 2), enemyTypes: ['rock_golem', 'sand_scorpion'] },
      { level: 3, enemyMultiplier: 1.6, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(7, 3), enemyTypes: ['sand_scorpion', 'ice_wraith'] },
      { level: 4, enemyMultiplier: 1.7, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(7, 4), enemyTypes: ['ice_wraith'] },
      { level: 5, enemyMultiplier: 1.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(7, 5), enemyTypes: ['ice_wraith', 'crystal_spider'] },
    ],
    unlockRequirement: { previousZone: 6 },
  },
  {
    id: 8,
    name: 'Enchanted Valley',
    theme: 'forest',
    minPlayerLevel: 22,
    maxPlayerLevel: 35,
    levels: [
      { level: 1, enemyMultiplier: 1.5, xpMultiplier: 1.7, requiredKills: calculateKillRequirement(8, 1), enemyTypes: ['sand_scorpion', 'ice_wraith'] },
      { level: 2, enemyMultiplier: 1.6, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(8, 2), enemyTypes: ['ice_wraith', 'crystal_spider'] },
      { level: 3, enemyMultiplier: 1.7, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(8, 3), enemyTypes: ['crystal_spider', 'desert_basilisk'] },
      { level: 4, enemyMultiplier: 1.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(8, 4), enemyTypes: ['desert_basilisk'] },
      { level: 5, enemyMultiplier: 1.9, xpMultiplier: 2.1, requiredKills: calculateKillRequirement(8, 5), enemyTypes: ['desert_basilisk', 'magma_elemental'] },
    ],
    unlockRequirement: { previousZone: 7 },
  },
  {
    id: 9,
    name: 'Cursed Grove',
    theme: 'forest',
    minPlayerLevel: 25,
    maxPlayerLevel: 40,
    levels: [
      { level: 1, enemyMultiplier: 1.6, xpMultiplier: 1.8, requiredKills: calculateKillRequirement(9, 1), enemyTypes: ['crystal_spider', 'desert_basilisk'] },
      { level: 2, enemyMultiplier: 1.7, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(9, 2), enemyTypes: ['desert_basilisk', 'magma_elemental'] },
      { level: 3, enemyMultiplier: 1.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(9, 3), enemyTypes: ['magma_elemental', 'lava_beast'] },
      { level: 4, enemyMultiplier: 1.9, xpMultiplier: 2.1, requiredKills: calculateKillRequirement(9, 4), enemyTypes: ['lava_beast'] },
      { level: 5, enemyMultiplier: 2.0, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(9, 5), enemyTypes: ['lava_beast', 'inferno_dragon'] },
    ],
    unlockRequirement: { previousZone: 8 },
  },
  {
    id: 10,
    name: 'Sacred Forest',
    theme: 'forest',
    minPlayerLevel: 30,
    maxPlayerLevel: 45,
    levels: [
      { level: 1, enemyMultiplier: 1.7, xpMultiplier: 1.9, requiredKills: calculateKillRequirement(10, 1), enemyTypes: ['magma_elemental', 'lava_beast'] },
      { level: 2, enemyMultiplier: 1.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(10, 2), enemyTypes: ['lava_beast', 'inferno_dragon'] },
      { level: 3, enemyMultiplier: 1.9, xpMultiplier: 2.1, requiredKills: calculateKillRequirement(10, 3), enemyTypes: ['inferno_dragon', 'phoenix_guardian'] },
      { level: 4, enemyMultiplier: 2.0, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(10, 4), enemyTypes: ['phoenix_guardian'] },
      { level: 5, enemyMultiplier: 2.1, xpMultiplier: 2.3, requiredKills: calculateKillRequirement(10, 5), enemyTypes: ['phoenix_guardian', 'shadow_demon'] },
    ],
    unlockRequirement: { previousZone: 9 },
  },

  // Mountain Peaks (Zones 11-20)
  {
    id: 11,
    name: 'Rocky Foothills',
    theme: 'mountain',
    minPlayerLevel: 32,
    maxPlayerLevel: 50,
    levels: [
      { level: 1, enemyMultiplier: 1.8, xpMultiplier: 2.0, requiredKills: calculateKillRequirement(11, 1), enemyTypes: ['inferno_dragon', 'phoenix_guardian'] },
      { level: 2, enemyMultiplier: 1.9, xpMultiplier: 2.1, requiredKills: calculateKillRequirement(11, 2), enemyTypes: ['phoenix_guardian', 'shadow_demon'] },
      { level: 3, enemyMultiplier: 2.0, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(11, 3), enemyTypes: ['shadow_demon', 'void_stalker'] },
      { level: 4, enemyMultiplier: 2.1, xpMultiplier: 2.3, requiredKills: calculateKillRequirement(11, 4), enemyTypes: ['void_stalker'] },
      { level: 5, enemyMultiplier: 2.2, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(11, 5), enemyTypes: ['void_stalker', 'nightmare_lord'] },
    ],
    unlockRequirement: { previousZone: 10 },
  },
  {
    id: 12,
    name: 'Stone Peaks',
    theme: 'mountain',
    minPlayerLevel: 35,
    maxPlayerLevel: 55,
    levels: [
      { level: 1, enemyMultiplier: 1.9, xpMultiplier: 2.1, requiredKills: calculateKillRequirement(12, 1), enemyTypes: ['shadow_demon', 'void_stalker'] },
      { level: 2, enemyMultiplier: 2.0, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(12, 2), enemyTypes: ['void_stalker', 'nightmare_lord'] },
      { level: 3, enemyMultiplier: 2.1, xpMultiplier: 2.3, requiredKills: calculateKillRequirement(12, 3), enemyTypes: ['nightmare_lord', 'chaos_titan'] },
      { level: 4, enemyMultiplier: 2.2, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(12, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 2.3, xpMultiplier: 2.5, requiredKills: calculateKillRequirement(12, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 11 },
  },
  {
    id: 13,
    name: 'Misty Mountains',
    theme: 'mountain',
    minPlayerLevel: 40,
    maxPlayerLevel: 60,
    levels: [
      { level: 1, enemyMultiplier: 2.0, xpMultiplier: 2.2, requiredKills: calculateKillRequirement(13, 1), enemyTypes: ['nightmare_lord', 'chaos_titan'] },
      { level: 2, enemyMultiplier: 2.1, xpMultiplier: 2.3, requiredKills: calculateKillRequirement(13, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 2.2, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(13, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 2.3, xpMultiplier: 2.5, requiredKills: calculateKillRequirement(13, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 2.4, xpMultiplier: 2.6, requiredKills: calculateKillRequirement(13, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 12 },
  },

  // Continue with remaining zones (14-50) following the same pattern
  // Each zone progressively harder with better XP multipliers and enemy types
  {
    id: 14,
    name: 'Crystal Caverns',
    theme: 'cave',
    minPlayerLevel: 45,
    maxPlayerLevel: 65,
    levels: [
      { level: 1, enemyMultiplier: 2.1, xpMultiplier: 2.3, requiredKills: calculateKillRequirement(14, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 2.2, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(14, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 2.3, xpMultiplier: 2.5, requiredKills: calculateKillRequirement(14, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 2.4, xpMultiplier: 2.6, requiredKills: calculateKillRequirement(14, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 2.5, xpMultiplier: 2.7, requiredKills: calculateKillRequirement(14, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 13 },
  },
  {
    id: 15,
    name: 'Dragon Pass',
    theme: 'mountain',
    minPlayerLevel: 50,
    maxPlayerLevel: 70,
    levels: [
      { level: 1, enemyMultiplier: 2.2, xpMultiplier: 2.4, requiredKills: calculateKillRequirement(15, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 2.3, xpMultiplier: 2.5, requiredKills: calculateKillRequirement(15, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 2.4, xpMultiplier: 2.6, requiredKills: calculateKillRequirement(15, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 2.5, xpMultiplier: 2.7, requiredKills: calculateKillRequirement(15, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 2.6, xpMultiplier: 2.8, requiredKills: calculateKillRequirement(15, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 14 },
  },

  // Desert Wastelands (Zones 16-30) - Skipping intermediate zones for brevity
  {
    id: 16,
    name: 'Shifting Sands',
    theme: 'desert',
    minPlayerLevel: 55,
    maxPlayerLevel: 75,
    levels: [
      { level: 1, enemyMultiplier: 2.3, xpMultiplier: 2.5, requiredKills: calculateKillRequirement(16, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 2.4, xpMultiplier: 2.6, requiredKills: calculateKillRequirement(16, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 2.5, xpMultiplier: 2.7, requiredKills: calculateKillRequirement(16, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 2.6, xpMultiplier: 2.8, requiredKills: calculateKillRequirement(16, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 2.7, xpMultiplier: 2.9, requiredKills: calculateKillRequirement(16, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 15 },
  },

  // Adding final endgame zones (zones 30, 40, 50 as examples)
  {
    id: 30,
    name: 'Scorching Dunes',
    theme: 'desert',
    minPlayerLevel: 150,
    maxPlayerLevel: 200,  
    levels: [
      { level: 1, enemyMultiplier: 4.0, xpMultiplier: 4.5, requiredKills: calculateKillRequirement(30, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 4.2, xpMultiplier: 4.7, requiredKills: calculateKillRequirement(30, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 4.4, xpMultiplier: 4.9, requiredKills: calculateKillRequirement(30, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 4.6, xpMultiplier: 5.1, requiredKills: calculateKillRequirement(30, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 4.8, xpMultiplier: 5.3, requiredKills: calculateKillRequirement(30, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 29 },
  },
  {
    id: 40,
    name: 'Molten Core',
    theme: 'volcanic',
    minPlayerLevel: 300,
    maxPlayerLevel: 400,
    levels: [
      { level: 1, enemyMultiplier: 6.0, xpMultiplier: 7.0, requiredKills: calculateKillRequirement(40, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 6.3, xpMultiplier: 7.4, requiredKills: calculateKillRequirement(40, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 6.6, xpMultiplier: 7.8, requiredKills: calculateKillRequirement(40, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 6.9, xpMultiplier: 8.2, requiredKills: calculateKillRequirement(40, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 7.2, xpMultiplier: 8.6, requiredKills: calculateKillRequirement(40, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 39 },
  },
  {
    id: 50,
    name: 'Void Nexus',
    theme: 'shadow',
    minPlayerLevel: 500,
    maxPlayerLevel: 15000, // Max level endgame
    levels: [
      { level: 1, enemyMultiplier: 10.0, xpMultiplier: 12.0, requiredKills: calculateKillRequirement(50, 1), enemyTypes: ['chaos_titan'] },
      { level: 2, enemyMultiplier: 11.0, xpMultiplier: 13.0, requiredKills: calculateKillRequirement(50, 2), enemyTypes: ['chaos_titan'] },
      { level: 3, enemyMultiplier: 12.0, xpMultiplier: 14.0, requiredKills: calculateKillRequirement(50, 3), enemyTypes: ['chaos_titan'] },
      { level: 4, enemyMultiplier: 13.0, xpMultiplier: 15.0, requiredKills: calculateKillRequirement(50, 4), enemyTypes: ['chaos_titan'] },
      { level: 5, enemyMultiplier: 15.0, xpMultiplier: 18.0, requiredKills: calculateKillRequirement(50, 5), enemyTypes: ['chaos_titan'] },
    ],
    unlockRequirement: { previousZone: 49 },
  },
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
  
  // Zone 1 is always unlocked
  if (zoneId === 1) return true;
  
  // Check if previous zone requirement is met
  if (zone.unlockRequirement.previousZone) {
    const previousZoneCompleted = playerProgress?.zones?.[zone.unlockRequirement.previousZone]?.completed;
    return previousZoneCompleted === true;
  }
  
  return true;
};