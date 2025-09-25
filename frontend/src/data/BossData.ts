// Boss System - 4 Bosses with 5 Difficulty Tiers Each
// Daily ticket system with equipment and material drops

export enum BossType {
  FIRE_DRAGON = 'fire_dragon',
  ICE_QUEEN = 'ice_queen',
  SHADOW_LORD = 'shadow_lord',
  EARTH_TITAN = 'earth_titan'
}

export interface BossStats {
  hp: number;
  attack: number;
  defense: number;
  critChance: number;
  abilities: string[]; // Special boss abilities
}

export interface BossRewards {
  goldMin: number;
  goldMax: number;
  experienceMin: number;
  experienceMax: number;
  guaranteedEquipment: boolean; // Always drops equipment
  equipmentTemplates: string[]; // Possible equipment drops
  materials: Record<string, { min: number; max: number }>; // Material drops
}

export interface BossTier {
  tier: number;
  name: string;
  requiredLevel: number;
  stats: BossStats;
  rewards: BossRewards;
  unlocked: boolean;
}

export interface Boss {
  id: BossType;
  name: string;
  description: string;
  icon: string;
  element: string;
  location: string;
  tiers: BossTier[];
}

// Boss Configuration Data
export const BOSS_DATA: Record<BossType, Boss> = {
  [BossType.FIRE_DRAGON]: {
    id: BossType.FIRE_DRAGON,
    name: 'Fire Dragon',
    description: 'Ancient dragon of eternal flames, guardian of molten treasures',
    icon: '🐉🔥',
    element: 'Fire',
    location: 'Volcanic Peaks',
    tiers: [
      {
        tier: 1,
        name: 'Ember Wyrm',
        requiredLevel: 5,
        stats: {
          hp: 1000, // Back to original (was 10000)
          attack: 50, // Back to original (was 500)
          defense: 20, // Back to original (was 200)
          critChance: 10,
          abilities: ['Fire Breath', 'Wing Strike']
        },
        rewards: {
          goldMin: 200,
          goldMax: 400,
          experienceMin: 50,
          experienceMax: 100,
          guaranteedEquipment: true,
          equipmentTemplates: ['flame_sword'],
          materials: {
            fire_essence: { min: 1, max: 2 },
            mystic_dust: { min: 2, max: 4 }
          }
        },
        unlocked: true
      },
      {
        tier: 2,
        name: 'Flame Drake',
        requiredLevel: 10,
        stats: {
          hp: 2500, // Back to original (was 25000)
          attack: 80, // Back to original (was 800)
          defense: 35, // Back to original (was 350)
          critChance: 15,
          abilities: ['Fire Breath', 'Wing Strike', 'Magma Pool']
        },
        rewards: {
          goldMin: 400,
          goldMax: 800,
          experienceMin: 100,
          experienceMax: 200,
          guaranteedEquipment: true,
          equipmentTemplates: ['flame_sword', 'inferno_blade'],
          materials: {
            fire_essence: { min: 2, max: 4 },
            mystic_dust: { min: 3, max: 6 }
          }
        },
        unlocked: false
      },
      {
        tier: 3,
        name: 'Inferno Wyvern',
        requiredLevel: 20,
        stats: {
          hp: 50000, // 10x harder (was 5000)
          attack: 1200, // 10x harder (was 120)
          defense: 500, // 10x harder (was 50)
          critChance: 20,
          abilities: ['Fire Breath', 'Wing Strike', 'Magma Pool', 'Meteor Strike']
        },
        rewards: {
          goldMin: 800,
          goldMax: 1500,
          experienceMin: 200,
          experienceMax: 400,
          guaranteedEquipment: true,
          equipmentTemplates: ['flame_sword', 'inferno_blade'],
          materials: {
            fire_essence: { min: 3, max: 6 },
            mystic_dust: { min: 5, max: 10 },
            ice_crystal: { min: 1, max: 2 } // Cross-element for high-tier upgrades
          }
        },
        unlocked: false
      },
      {
        tier: 4,
        name: 'Crimson Dragon',
        requiredLevel: 35,
        stats: {
          hp: 10000, // Back to original (was 100000)
          attack: 180, // Back to original (was 1800)
          defense: 75, // Back to original (was 750)
          critChance: 25,
          abilities: ['Fire Breath', 'Wing Strike', 'Magma Pool', 'Meteor Strike', 'Dragon Rage']
        },
        rewards: {
          goldMin: 1500,
          goldMax: 3000,
          experienceMin: 400,
          experienceMax: 800,
          guaranteedEquipment: true,
          equipmentTemplates: ['flame_sword', 'inferno_blade'],
          materials: {
            fire_essence: { min: 5, max: 10 },
            mystic_dust: { min: 8, max: 15 },
            ice_crystal: { min: 2, max: 4 }
          }
        },
        unlocked: false
      },
      {
        tier: 5,
        name: 'Ancient Fire Lord',
        requiredLevel: 50,
        stats: {
          hp: 20000, // Back to original (was 200000)
          attack: 250, // Back to original (was 2500)
          defense: 100, // Back to original (was 1000)
          critChance: 30,
          abilities: ['Fire Breath', 'Wing Strike', 'Magma Pool', 'Meteor Strike', 'Dragon Rage', 'Phoenix Rebirth']
        },
        rewards: {
          goldMin: 3000,
          goldMax: 6000,
          experienceMin: 800,
          experienceMax: 1500,
          guaranteedEquipment: true,
          equipmentTemplates: ['flame_sword', 'inferno_blade'],
          materials: {
            fire_essence: { min: 10, max: 20 },
            mystic_dust: { min: 15, max: 30 },
            ice_crystal: { min: 3, max: 6 },
            shadow_orb: { min: 1, max: 2 }
          }
        },
        unlocked: false
      }
    ]
  },

  [BossType.ICE_QUEEN]: {
    id: BossType.ICE_QUEEN,
    name: 'Ice Queen',
    description: 'Sovereign of the eternal winter, master of frost and crystal',
    icon: '👑❄️',
    element: 'Ice',
    location: 'Frozen Citadel',
    tiers: [
      {
        tier: 1,
        name: 'Frost Maiden',
        requiredLevel: 8,
        stats: {
          hp: 1200,
          attack: 40,
          defense: 30,
          critChance: 8,
          abilities: ['Ice Shard', 'Freeze']
        },
        rewards: {
          goldMin: 250,
          goldMax: 500,
          experienceMin: 60,
          experienceMax: 120,
          guaranteedEquipment: true,
          equipmentTemplates: ['frost_crown', 'ice_helmet'],
          materials: {
            ice_crystal: { min: 1, max: 2 },
            mystic_dust: { min: 2, max: 4 }
          }
        },
        unlocked: true
      },
      {
        tier: 2,
        name: 'Winter Empress',
        requiredLevel: 15,
        stats: {
          hp: 3000,
          attack: 70,
          defense: 50,
          critChance: 12,
          abilities: ['Ice Shard', 'Freeze', 'Blizzard']
        },
        rewards: {
          goldMin: 500,
          goldMax: 1000,
          experienceMin: 120,
          experienceMax: 240,
          guaranteedEquipment: true,
          equipmentTemplates: ['frost_crown', 'ice_helmet', 'glacier_armor', 'frozen_robes'],
          materials: {
            ice_crystal: { min: 2, max: 4 },
            mystic_dust: { min: 3, max: 6 }
          }
        },
        unlocked: false
      },
      {
        tier: 3,
        name: 'Glacier Sovereign',
        requiredLevel: 25,
        stats: {
          hp: 6000,
          attack: 110,
          defense: 70,
          critChance: 18,
          abilities: ['Ice Shard', 'Freeze', 'Blizzard', 'Ice Age']
        },
        rewards: {
          goldMin: 1000,
          goldMax: 2000,
          experienceMin: 240,
          experienceMax: 480,
          guaranteedEquipment: true,
          equipmentTemplates: ['frost_crown', 'ice_helmet', 'glacier_armor', 'frozen_robes'],
          materials: {
            ice_crystal: { min: 3, max: 6 },
            mystic_dust: { min: 5, max: 10 },
            fire_essence: { min: 1, max: 2 }
          }
        },
        unlocked: false
      },
      {
        tier: 4,
        name: 'Crystal Monarch',
        requiredLevel: 40,
        stats: {
          hp: 12000,
          attack: 160,
          defense: 95,
          critChance: 22,
          abilities: ['Ice Shard', 'Freeze', 'Blizzard', 'Ice Age', 'Absolute Zero']
        },
        rewards: {
          goldMin: 2000,
          goldMax: 4000,
          experienceMin: 480,
          experienceMax: 960,
          guaranteedEquipment: true,
          equipmentTemplates: ['frost_crown', 'ice_helmet', 'glacier_armor', 'frozen_robes'],
          materials: {
            ice_crystal: { min: 5, max: 10 },
            mystic_dust: { min: 8, max: 15 },
            fire_essence: { min: 2, max: 4 }
          }
        },
        unlocked: false
      },
      {
        tier: 5,
        name: 'Eternal Ice Queen',
        requiredLevel: 55,
        stats: {
          hp: 25000,
          attack: 220,
          defense: 120,
          critChance: 28,
          abilities: ['Ice Shard', 'Freeze', 'Blizzard', 'Ice Age', 'Absolute Zero', 'Eternal Winter']
        },
        rewards: {
          goldMin: 4000,
          goldMax: 8000,
          experienceMin: 960,
          experienceMax: 1800,
          guaranteedEquipment: true,
          equipmentTemplates: ['frost_crown', 'ice_helmet', 'glacier_armor', 'frozen_robes'],
          materials: {
            ice_crystal: { min: 10, max: 20 },
            mystic_dust: { min: 15, max: 30 },
            fire_essence: { min: 3, max: 6 },
            earth_fragment: { min: 1, max: 2 }
          }
        },
        unlocked: false
      }
    ]
  },

  [BossType.SHADOW_LORD]: {
    id: BossType.SHADOW_LORD,
    name: 'Shadow Lord',
    description: 'Master of darkness and void, wielder of shadow magic',
    icon: '🌑👤',
    element: 'Shadow',
    location: 'Void Realm',
    tiers: [
      {
        tier: 1,
        name: 'Dark Wraith',
        requiredLevel: 12,
        stats: {
          hp: 1500,
          attack: 60,
          defense: 25,
          critChance: 20,
          abilities: ['Shadow Strike', 'Stealth']
        },
        rewards: {
          goldMin: 300,
          goldMax: 600,
          experienceMin: 80,
          experienceMax: 160,
          guaranteedEquipment: true,
          equipmentTemplates: ['shadow_ring', 'void_amulet'],
          materials: {
            shadow_orb: { min: 1, max: 2 },
            mystic_dust: { min: 3, max: 5 }
          }
        },
        unlocked: true
      },
      {
        tier: 2,
        name: 'Void Knight',
        requiredLevel: 18,
        stats: {
          hp: 3500,
          attack: 90,
          defense: 40,
          critChance: 25,
          abilities: ['Shadow Strike', 'Stealth', 'Dark Blade']
        },
        rewards: {
          goldMin: 600,
          goldMax: 1200,
          experienceMin: 160,
          experienceMax: 320,
          guaranteedEquipment: true,
          equipmentTemplates: ['shadow_ring', 'void_amulet'],
          materials: {
            shadow_orb: { min: 2, max: 4 },
            mystic_dust: { min: 4, max: 8 }
          }
        },
        unlocked: false
      },
      {
        tier: 3,
        name: 'Darkness Prince',
        requiredLevel: 30,
        stats: {
          hp: 7500,
          attack: 140,
          defense: 60,
          critChance: 30,
          abilities: ['Shadow Strike', 'Stealth', 'Dark Blade', 'Void Portal']
        },
        rewards: {
          goldMin: 1200,
          goldMax: 2500,
          experienceMin: 320,
          experienceMax: 640,
          guaranteedEquipment: true,
          equipmentTemplates: ['shadow_ring', 'void_amulet'],
          materials: {
            shadow_orb: { min: 3, max: 6 },
            mystic_dust: { min: 6, max: 12 },
            earth_fragment: { min: 1, max: 2 }
          }
        },
        unlocked: false
      },
      {
        tier: 4,
        name: 'Void Emperor',
        requiredLevel: 45,
        stats: {
          hp: 15000,
          attack: 200,
          defense: 85,
          critChance: 35,
          abilities: ['Shadow Strike', 'Stealth', 'Dark Blade', 'Void Portal', 'Shadow Realm']
        },
        rewards: {
          goldMin: 2500,
          goldMax: 5000,
          experienceMin: 640,
          experienceMax: 1280,
          guaranteedEquipment: true,
          equipmentTemplates: ['shadow_ring', 'void_amulet'],
          materials: {
            shadow_orb: { min: 5, max: 10 },
            mystic_dust: { min: 10, max: 20 },
            earth_fragment: { min: 2, max: 4 }
          }
        },
        unlocked: false
      },
      {
        tier: 5,
        name: 'Ancient Shadow Lord',
        requiredLevel: 60,
        stats: {
          hp: 30000,
          attack: 280,
          defense: 110,
          critChance: 40,
          abilities: ['Shadow Strike', 'Stealth', 'Dark Blade', 'Void Portal', 'Shadow Realm', 'Oblivion']
        },
        rewards: {
          goldMin: 5000,
          goldMax: 10000,
          experienceMin: 1280,
          experienceMax: 2400,
          guaranteedEquipment: true,
          equipmentTemplates: ['shadow_ring', 'void_amulet'],
          materials: {
            shadow_orb: { min: 10, max: 20 },
            mystic_dust: { min: 20, max: 40 },
            earth_fragment: { min: 3, max: 6 },
            fire_essence: { min: 1, max: 2 }
          }
        },
        unlocked: false
      }
    ]
  },

  [BossType.EARTH_TITAN]: {
    id: BossType.EARTH_TITAN,
    name: 'Earth Titan',
    description: 'Colossal guardian of ancient mountains and stone',
    icon: '⛰️🗿',
    element: 'Earth',
    location: 'Mountain Core',
    tiers: [
      {
        tier: 1,
        name: 'Stone Golem',
        requiredLevel: 6,
        stats: {
          hp: 2000,
          attack: 35,
          defense: 40,
          critChance: 5,
          abilities: ['Rock Throw', 'Stomp']
        },
        rewards: {
          goldMin: 200,
          goldMax: 450,
          experienceMin: 70,
          experienceMax: 140,
          guaranteedEquipment: true,
          equipmentTemplates: ['titan_gauntlets', 'mountain_shield'],
          materials: {
            earth_fragment: { min: 1, max: 3 },
            mystic_dust: { min: 2, max: 4 }
          }
        },
        unlocked: true
      },
      {
        tier: 2,
        name: 'Boulder Guardian',
        requiredLevel: 13,
        stats: {
          hp: 4000,
          attack: 60,
          defense: 65,
          critChance: 8,
          abilities: ['Rock Throw', 'Stomp', 'Earthquake']
        },
        rewards: {
          goldMin: 450,
          goldMax: 900,
          experienceMin: 140,
          experienceMax: 280,
          guaranteedEquipment: true,
          equipmentTemplates: ['titan_gauntlets', 'mountain_shield'],
          materials: {
            earth_fragment: { min: 2, max: 5 },
            mystic_dust: { min: 3, max: 6 }
          }
        },
        unlocked: false
      },
      {
        tier: 3,
        name: 'Mountain Lord',
        requiredLevel: 22,
        stats: {
          hp: 8000,
          attack: 95,
          defense: 90,
          critChance: 12,
          abilities: ['Rock Throw', 'Stomp', 'Earthquake', 'Avalanche']
        },
        rewards: {
          goldMin: 900,
          goldMax: 1800,
          experienceMin: 280,
          experienceMax: 560,
          guaranteedEquipment: true,
          equipmentTemplates: ['titan_gauntlets', 'mountain_shield'],
          materials: {
            earth_fragment: { min: 3, max: 7 },
            mystic_dust: { min: 5, max: 10 },
            shadow_orb: { min: 1, max: 2 }
          }
        },
        unlocked: false
      },
      {
        tier: 4,
        name: 'Granite Colossus',
        requiredLevel: 38,
        stats: {
          hp: 16000,
          attack: 140,
          defense: 120,
          critChance: 15,
          abilities: ['Rock Throw', 'Stomp', 'Earthquake', 'Avalanche', 'Continental Drift']
        },
        rewards: {
          goldMin: 1800,
          goldMax: 3600,
          experienceMin: 560,
          experienceMax: 1120,
          guaranteedEquipment: true,
          equipmentTemplates: ['titan_gauntlets', 'mountain_shield'],
          materials: {
            earth_fragment: { min: 5, max: 12 },
            mystic_dust: { min: 8, max: 16 },
            shadow_orb: { min: 2, max: 4 }
          }
        },
        unlocked: false
      },
      {
        tier: 5,
        name: 'Ancient Earth Titan',
        requiredLevel: 52,
        stats: {
          hp: 35000,
          attack: 200,
          defense: 150,
          critChance: 18,
          abilities: ['Rock Throw', 'Stomp', 'Earthquake', 'Avalanche', 'Continental Drift', 'World Shatter']
        },
        rewards: {
          goldMin: 3600,
          goldMax: 7200,
          experienceMin: 1120,
          experienceMax: 2100,
          guaranteedEquipment: true,
          equipmentTemplates: ['titan_gauntlets', 'mountain_shield'],
          materials: {
            earth_fragment: { min: 10, max: 25 },
            mystic_dust: { min: 15, max: 30 },
            shadow_orb: { min: 3, max: 6 },
            ice_crystal: { min: 1, max: 2 }
          }
        },
        unlocked: false
      }
    ]
  }
};

// Daily boss system
export interface DailyBossState {
  ticketsRemaining: number;
  maxTickets: number;
  lastResetTime: number;
  bossProgress: Record<BossType, {
    highestTierDefeated: number;
    totalVictories: number;
    unlockedTiers: number[];
  }>;
}

export const DAILY_BOSS_CONFIG = {
  maxTickets: 5, // 5 attempts per day
  ticketResetHours: 24, // Reset every 24 hours
  ticketRegenTime: 4.8, // One ticket every 4.8 hours (5 tickets per day)
};