// Zone and Enemy Data for 10-Zone Aggressive Progression System  
// Aggressive scaling for level 1-15,000 progression
// Each zone covers 1,500 levels with exponential difficulty scaling

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

// Enemy Types Database (same as before - properly scaled with TRIPLED XP)
export const ENEMY_TYPES: Record<string, EnemyType> = {
  // Forest Realms (Zones 1-10)
  'forest_goblin': {
    id: 'forest_goblin',
    name: 'Forest Goblin',
    icon: '👹',
    baseHP: 15,
    baseAttack: 8,
    baseXP: 120, // 6X from original 20 (tripled to 60, now doubled to 120)
  },
  'wild_wolf': {
    id: 'wild_wolf', 
    name: 'Wild Wolf',
    icon: '🐺',
    baseHP: 25,
    baseAttack: 12,
    baseXP: 90, // 6X from original 15 (tripled to 45, now doubled to 90)
  },
  'tree_guardian': {
    id: 'tree_guardian',
    name: 'Tree Guardian', 
    icon: '🌳',
    baseHP: 45,
    baseAttack: 15,
    baseXP: 150, // 6X from original 25 (tripled to 75, now doubled to 150)
    resistances: { physical: 0.2 }
  },
  'dark_sprite': {
    id: 'dark_sprite',
    name: 'Dark Sprite',
    icon: '🧚‍♀️',
    baseHP: 20,
    baseAttack: 18,
    baseXP: 120, // 6X from original 20 (tripled to 60, now doubled to 120)
    resistances: { magic: 0.3 }
  },
  'shadow_wolf': {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    icon: '🐺',
    baseHP: 30,
    baseAttack: 20,
    baseXP: 150, // 6X from original 25 (tripled to 75, now doubled to 150)
    resistances: { magic: 0.2 }
  },
  'ancient_oak': {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    icon: '🌲',
    baseHP: 80,
    baseAttack: 25,
    baseXP: 210, // 6X from original 35 (tripled to 105, now doubled to 210)
    resistances: { physical: 0.3 }
  },
  'flame_salamander': {
    id: 'flame_salamander',
    name: 'Flame Salamander',
    icon: '🦎',
    baseHP: 40,
    baseAttack: 30,
    baseXP: 270, // 6X from original 45 (tripled to 135, now doubled to 270)
    resistances: { physical: 0.4, fire: -0.3 }
  },

  // Mountain Peaks (Zones 11-20)
  'mountain_orc': {
    id: 'mountain_orc',
    name: 'Mountain Orc',
    icon: '🧌',
    baseHP: 50,
    baseAttack: 22,
    baseXP: 180, // 6X from original 30 (tripled to 90, now doubled to 180)
  },
  'stone_giant': {
    id: 'stone_giant',
    name: 'Stone Giant',
    icon: '🗿',
    baseHP: 80,
    baseAttack: 28,
    baseXP: 240, // 6X from original 40 (tripled to 120, now doubled to 240)
  },
  'fire_drake': {
    id: 'fire_drake',
    name: 'Fire Drake',
    icon: '🐉',
    baseHP: 60,
    baseAttack: 35,
    baseXP: 300, // 6X from original 50 (tripled to 150, now doubled to 300)
    resistances: { fire: 0.8, ice: -0.5 }
  },
  'rock_golem': {
    id: 'rock_golem',
    name: 'Rock Golem',
    icon: '🪨',
    baseHP: 100,
    baseAttack: 30,
    baseXP: 270, // 6X from original 45 (tripled to 135, now doubled to 270)
    resistances: { physical: 0.4 }
  },

  // Desert Wastelands (Zones 21-30)
  'sand_scorpion': {
    id: 'sand_scorpion',
    name: 'Sand Scorpion',
    icon: '🦂',
    baseHP: 45,
    baseAttack: 45,
    baseXP: 360, // 6X from original 60 (tripled to 180, now doubled to 360)
  },
  'ice_wraith': {
    id: 'ice_wraith',
    name: 'Ice Wraith',
    icon: '👻',
    baseHP: 55,
    baseAttack: 40,
    baseXP: 420, // 6X from original 70 (tripled to 210, now doubled to 420)
    resistances: { ice: 0.6, fire: -0.3 }
  },
  'crystal_spider': {
    id: 'crystal_spider',
    name: 'Crystal Spider',
    icon: '🕷️',
    baseHP: 65,
    baseAttack: 55,
    baseXP: 390, // 6X from original 65 (tripled to 195, now doubled to 390)
  },
  'desert_basilisk': {
    id: 'desert_basilisk',
    name: 'Desert Basilisk',
    icon: '🐍',
    baseHP: 70,
    baseAttack: 50,
    baseXP: 480, // 6X from original 80 (tripled to 240, now doubled to 480)
    resistances: { physical: 0.5 }
  },

  // Volcanic Fields (Zones 31-40)
  'magma_elemental': {
    id: 'magma_elemental',
    name: 'Magma Elemental',
    icon: '🔥',
    baseHP: 80,
    baseAttack: 60,
    baseXP: 510, // 6X from original 85 (tripled to 255, now doubled to 510)
  },
  'lava_beast': {
    id: 'lava_beast',
    name: 'Lava Beast',
    icon: '🦏',
    baseHP: 90,
    baseAttack: 70,
    baseXP: 540, // 6X from original 90 (tripled to 270, now doubled to 540)
  },
  'inferno_dragon': {
    id: 'inferno_dragon',
    name: 'Inferno Dragon',
    icon: '🐲',
    baseHP: 120,
    baseAttack: 75,
    baseXP: 600, // 6X from original 100 (tripled to 300, now doubled to 600)
    resistances: { fire: 0.7 }
  },
  'phoenix_guardian': {
    id: 'phoenix_guardian',
    name: 'Phoenix Guardian',
    icon: '🔥🦅',
    baseHP: 100,
    baseAttack: 80,
    baseXP: 660, // 6X from original 110 (tripled to 330, now doubled to 660)
    resistances: { magic: 0.4 }
  },

  // Shadow Realm (Zones 41-50)
  'shadow_demon': {
    id: 'shadow_demon',
    name: 'Shadow Demon',
    icon: '👹',
    baseHP: 150,
    baseAttack: 100,
    baseXP: 900, // 6X from original 150 (tripled to 450, now doubled to 900)
  },
  'void_stalker': {
    id: 'void_stalker',
    name: 'Void Stalker',
    icon: '👤',
    baseHP: 180,
    baseAttack: 120,
    baseXP: 1080, // 6X from original 180 (tripled to 540, now doubled to 1080)
    resistances: { magic: 0.6 }
  },
  'nightmare_lord': {
    id: 'nightmare_lord',
    name: 'Nightmare Lord',
    icon: '💀',
    baseHP: 200,
    baseAttack: 150,
    baseXP: 1200, // 6X from original 200 (tripled to 600, now doubled to 1200)
  },
  'chaos_titan': {
    id: 'chaos_titan',
    name: 'Chaos Titan',
    icon: '⚡',
    baseHP: 300,
    baseAttack: 200,
    baseXP: 1800, // 6X from original 300 (tripled to 900, now doubled to 1800)
    resistances: { fire: 0.8, physical: 0.3 }
  },

  // Endgame Enemies (Zones 41-50)
  'void_emperor': {
    id: 'void_emperor',
    name: 'Void Emperor',
    icon: '👑💀',
    baseHP: 500,
    baseAttack: 300,
    baseXP: 1500, // Ultra high XP for endgame
    resistances: { magic: 0.8, physical: 0.5 }
  },
  'cosmic_leviathan': {
    id: 'cosmic_leviathan',
    name: 'Cosmic Leviathan',
    icon: '🐲🌌',
    baseHP: 800,
    baseAttack: 400,
    baseXP: 2400, // Ultra high XP for endgame
    resistances: { fire: 0.9, ice: 0.9, magic: 0.7 }
  },
  'reality_shatterer': {
    id: 'reality_shatterer',
    name: 'Reality Shatterer',
    icon: '💥🌌',
    baseHP: 1200,
    baseAttack: 600,
    baseXP: 3600, // Ultra high XP for final zones
    resistances: { physical: 0.8, magic: 0.8, fire: 0.8, ice: 0.8 }
  },
};

// Helper function to calculate linear progression kill requirements
const calculateKillRequirement = (zoneId: number, level: number): number => {
  // Balanced kill requirements across all zones
  if (zoneId <= 10) return 25 + (level * 5);      // Zones 1-10: 30-50 kills per level
  if (zoneId <= 25) return 40 + (level * 10);     // Zones 11-25: 50-90 kills per level  
  if (zoneId <= 40) return 60 + (level * 15);     // Zones 26-40: 75-135 kills per level
  return 100 + (level * 25);                      // Zones 41-50: 125-225 kills per level (endgame)
};

// Generate zones dynamically with aggressive scaling for 10 zones covering levels 1-15,000
const generateZones = (): Zone[] => {
  const zones: Zone[] = [];
  
  // 10 AGGRESSIVE ZONES - Each covering 1,500 levels
  const zoneConfig = [
    { id: 1, name: 'Emerald Sanctum', theme: 'forest', levelRange: [1, 1500], enemies: ['forest_goblin', 'wild_wolf', 'tree_guardian'] },
    { id: 2, name: 'Crimson Peaks', theme: 'mountain', levelRange: [1501, 3000], enemies: ['mountain_orc', 'stone_giant', 'fire_drake'] },
    { id: 3, name: 'Scorching Wasteland', theme: 'desert', levelRange: [3001, 4500], enemies: ['sand_scorpion', 'desert_basilisk', 'flame_salamander'] },
    { id: 4, name: 'Molten Abyss', theme: 'volcanic', levelRange: [4501, 6000], enemies: ['magma_elemental', 'lava_beast', 'inferno_dragon'] },
    { id: 5, name: 'Frozen Citadel', theme: 'ice', levelRange: [6001, 7500], enemies: ['ice_wraith', 'crystal_spider', 'phoenix_guardian'] },
    { id: 6, name: 'Shadow Nexus', theme: 'shadow', levelRange: [7501, 9000], enemies: ['shadow_demon', 'void_stalker', 'nightmare_lord'] },
    { id: 7, name: 'Celestial Realm', theme: 'divine', levelRange: [9001, 10500], enemies: ['chaos_titan', 'void_stalker', 'nightmare_lord'] },
    { id: 8, name: 'Void Dimension', theme: 'cosmic', levelRange: [10501, 12000], enemies: ['chaos_titan', 'shadow_demon', 'inferno_dragon'] },
    { id: 9, name: 'Reality Rift', theme: 'quantum', levelRange: [12001, 13500], enemies: ['nightmare_lord', 'chaos_titan', 'void_stalker'] },
    { id: 10, name: 'Final Frontier', theme: 'endgame', levelRange: [13501, 15000], enemies: ['chaos_titan', 'nightmare_lord', 'shadow_demon'] }
  ];

  zoneConfig.forEach((config) => {
    const [minLevel, maxLevel] = config.levelRange;
    const levelSpan = maxLevel - minLevel + 1; // 1500 levels per zone
    
    // AGGRESSIVE SCALING: Each zone gets exponentially harder
    const zoneMultiplier = Math.pow(2, config.id - 1); // Zone 1: 1x, Zone 2: 2x, Zone 3: 4x, etc.
    
    // Generate 5 levels per zone (each covering 300 character levels)
    const levels: ZoneLevel[] = [];
    for (let level = 1; level <= 5; level++) {
      // Each zone level covers 300 character levels (1500 ÷ 5 = 300)
      const levelMultiplier = zoneMultiplier * (1 + (level - 1) * 0.5); // Exponential within zone
      
      levels.push({
        level,
        enemyMultiplier: levelMultiplier,
        xpMultiplier: levelMultiplier,
        // AGGRESSIVE KILL REQUIREMENTS: Scale with zone and level
        requiredKills: Math.floor(50 + (config.id * 50) + (level * 25)), // Zone 1 L1: 125, Zone 10 L5: 675
        enemyTypes: config.enemies
      });
    }
    
    zones.push({
      id: config.id,
      name: config.name,
      theme: config.theme,
      minPlayerLevel: minLevel,
      maxPlayerLevel: maxLevel,
      levels,
      unlockRequirement: config.id === 1 ? {} : { previousZone: config.id - 1 }
    });
  });
  
  return zones;
};

// Generate all 10 zones with aggressive scaling
export const ZONES: Zone[] = generateZones();

// Utility Functions
export const calculateEnemyStats = (enemyType: EnemyType, zoneLevel: ZoneLevel, zoneId: number) => {
  const scalingFactor = Math.pow(1.15, (zoneId - 1) * 5 + zoneLevel.level);
  
  // CRITICAL FIX: Scale down massive HP and attack values for balanced gameplay
  const baseHP = Math.floor(enemyType.baseHP * zoneLevel.enemyMultiplier * scalingFactor / 1000); // Scale down by 1000x
  const baseAttack = Math.floor(enemyType.baseAttack * zoneLevel.enemyMultiplier * scalingFactor / 100); // Scale down by 100x
  
  return {
    hp: Math.max(1, baseHP), // Minimum 1 HP
    attack: Math.max(1, baseAttack), // Minimum 1 attack
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