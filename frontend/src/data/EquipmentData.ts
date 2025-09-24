// Equipment System - Gear Data and Types
// Supports 4 slots with rarity tiers and stat bonuses

export enum EquipmentSlot {
  HEAD = 'head',
  BODY = 'body', 
  WEAPON = 'weapon',
  ACCESSORY = 'accessory'
}

export enum EquipmentRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon', 
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface EquipmentStats {
  attack?: number;
  hp?: number;
  defense?: number;
  critChance?: number; // Percentage (1-100)
  cooldownReduction?: number; // Percentage (1-100)
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  level: number; // Enhancement level (0-10)
  baseStats: EquipmentStats;
  currentStats: EquipmentStats; // After upgrades
  icon: string;
  description: string;
  sourceType: 'boss_drop' | 'zone_drop' | 'craft';
  sourceName?: string; // Boss name or zone name
}

// Rarity configuration
export const RARITY_CONFIG = {
  [EquipmentRarity.COMMON]: {
    name: 'Common',
    color: '#9ca3af', // Gray
    statMultiplier: 1.0,
    upgradeMultiplier: 1.1,
  },
  [EquipmentRarity.UNCOMMON]: {
    name: 'Uncommon', 
    color: '#10b981', // Green
    statMultiplier: 1.3,
    upgradeMultiplier: 1.15,
  },
  [EquipmentRarity.RARE]: {
    name: 'Rare',
    color: '#3b82f6', // Blue  
    statMultiplier: 1.6,
    upgradeMultiplier: 1.2,
  },
  [EquipmentRarity.EPIC]: {
    name: 'Epic',
    color: '#8b5cf6', // Purple
    statMultiplier: 2.0,
    upgradeMultiplier: 1.3,
  },
  [EquipmentRarity.LEGENDARY]: {
    name: 'Legendary',
    color: '#f59e0b', // Orange/Gold
    statMultiplier: 2.8,
    upgradeMultiplier: 1.5,
  }
};

// Equipment Templates - Base items that can be generated with different rarities
export const EQUIPMENT_TEMPLATES = {
  // Weapons (Fire Dragon drops)
  flame_sword: {
    name: 'Flame Sword',
    slot: EquipmentSlot.WEAPON,
    icon: '🔥⚔️',
    description: 'A blazing sword forged in dragon fire',
    baseStats: { attack: 15, critChance: 8 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Fire Dragon'
  },
  inferno_blade: {
    name: 'Inferno Blade', 
    slot: EquipmentSlot.WEAPON,
    icon: '🌋⚔️',
    description: 'Molten metal shaped by ancient flames',
    baseStats: { attack: 20, critChance: 12 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Fire Dragon'
  },

  // Head Gear (Ice Queen drops)
  frost_crown: {
    name: 'Frost Crown',
    slot: EquipmentSlot.HEAD,
    icon: '👑❄️',
    description: 'Royal headpiece of the frozen realm',
    baseStats: { hp: 25, defense: 8, cooldownReduction: 10 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Ice Queen'
  },
  ice_helmet: {
    name: 'Ice Helmet',
    slot: EquipmentSlot.HEAD,
    icon: '⛑️❄️', 
    description: 'Crystallized protection from eternal winter',
    baseStats: { hp: 30, defense: 12 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Ice Queen'
  },

  // Body Armor (Ice Queen drops)
  glacier_armor: {
    name: 'Glacier Armor',
    slot: EquipmentSlot.BODY,
    icon: '🛡️❄️',
    description: 'Impenetrable ice forged into protective mail',
    baseStats: { hp: 40, defense: 15, cooldownReduction: 5 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Ice Queen'
  },
  frozen_robes: {
    name: 'Frozen Robes',
    slot: EquipmentSlot.BODY,
    icon: '👘❄️',
    description: 'Mystical garments woven from frost',
    baseStats: { hp: 35, cooldownReduction: 15 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Ice Queen'
  },

  // Accessories (Shadow Lord drops)
  shadow_ring: {
    name: 'Shadow Ring',
    slot: EquipmentSlot.ACCESSORY,
    icon: '💍🌑',
    description: 'A ring that bends light and shadow',
    baseStats: { attack: 8, critChance: 15, cooldownReduction: 12 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Shadow Lord'
  },
  void_amulet: {
    name: 'Void Amulet',
    slot: EquipmentSlot.ACCESSORY,
    icon: '🔮🌑',
    description: 'Contains the essence of the dark realm',
    baseStats: { attack: 12, critChance: 20 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Shadow Lord'
  },

  // Defense Gear (Earth Titan drops) 
  titan_gauntlets: {
    name: 'Titan Gauntlets',
    slot: EquipmentSlot.ACCESSORY,
    icon: '🧤⛰️',
    description: 'Massive stone fists of the earth guardian',
    baseStats: { attack: 10, defense: 20, hp: 30 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Earth Titan'
  },
  mountain_shield: {
    name: 'Mountain Shield', 
    slot: EquipmentSlot.ACCESSORY,
    icon: '🛡️⛰️',
    description: 'Forged from the core of ancient mountains',
    baseStats: { defense: 25, hp: 40 },
    sourceType: 'boss_drop' as const,
    sourceName: 'Earth Titan'
  }
};

// Utility Functions
export const generateEquipment = (
  templateId: string, 
  rarity: EquipmentRarity, 
  level: number = 0
): Equipment => {
  const template = EQUIPMENT_TEMPLATES[templateId as keyof typeof EQUIPMENT_TEMPLATES];
  if (!template) {
    throw new Error(`Equipment template ${templateId} not found`);
  }

  const rarityConfig = RARITY_CONFIG[rarity];
  const baseStats = { ...template.baseStats };
  
  // Apply rarity multiplier to base stats
  const scaledStats: EquipmentStats = {};
  Object.entries(baseStats).forEach(([key, value]) => {
    if (typeof value === 'number') {
      scaledStats[key as keyof EquipmentStats] = Math.floor(value * rarityConfig.statMultiplier);
    }
  });

  // Apply level upgrades
  const currentStats: EquipmentStats = {};
  Object.entries(scaledStats).forEach(([key, value]) => {
    if (typeof value === 'number') {
      const levelMultiplier = Math.pow(rarityConfig.upgradeMultiplier, level);
      currentStats[key as keyof EquipmentStats] = Math.floor(value * levelMultiplier);
    }
  });

  return {
    id: `${templateId}_${rarity}_${Date.now()}`,
    name: template.name,
    slot: template.slot,
    rarity,
    level,
    baseStats: scaledStats,
    currentStats,
    icon: template.icon,
    description: template.description,
    sourceType: template.sourceType,
    sourceName: template.sourceName
  };
};

export const calculateTotalStats = (equippedGear: Record<EquipmentSlot, Equipment | null>): EquipmentStats => {
  const totalStats: EquipmentStats = {
    attack: 0,
    hp: 0, 
    defense: 0,
    critChance: 0,
    cooldownReduction: 0
  };

  Object.values(equippedGear).forEach(equipment => {
    if (equipment) {
      Object.entries(equipment.currentStats).forEach(([key, value]) => {
        if (typeof value === 'number' && key in totalStats) {
          totalStats[key as keyof EquipmentStats] = (totalStats[key as keyof EquipmentStats] || 0) + value;
        }
      });
    }
  });

  return totalStats;
};

export const getUpgradeCost = (equipment: Equipment): number => {
  const baseCost = 100;
  const rarityMultiplier = Object.values(EquipmentRarity).indexOf(equipment.rarity) + 1;
  return baseCost * rarityMultiplier * Math.pow(2, equipment.level);
};

export const canUpgradeEquipment = (equipment: Equipment): boolean => {
  return equipment.level < 10; // Max level 10
};