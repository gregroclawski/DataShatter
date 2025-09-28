// Equipment System - Gear Data and Types
// Supports 4 slots with rarity tiers and stat bonuses
// Upgrade materials system for boss drops

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

// Upgrade Materials from Boss Drops
export enum UpgradeMaterial {
  FIRE_ESSENCE = 'fire_essence',
  ICE_CRYSTAL = 'ice_crystal', 
  SHADOW_ORB = 'shadow_orb',
  EARTH_FRAGMENT = 'earth_fragment',
  MYSTIC_DUST = 'mystic_dust' // Common material from all bosses
}

export interface UpgradeMaterialData {
  id: UpgradeMaterial;
  name: string;
  icon: string;
  description: string;
  rarity: EquipmentRarity;
  source: string; // Boss name
}

export const UPGRADE_MATERIALS: Record<UpgradeMaterial, UpgradeMaterialData> = {
  [UpgradeMaterial.FIRE_ESSENCE]: {
    id: UpgradeMaterial.FIRE_ESSENCE,
    name: 'Fire Essence',
    icon: '🔥🔸',
    description: 'Crystallized dragon flame, burns with eternal heat',
    rarity: EquipmentRarity.RARE,
    source: 'Fire Dragon'
  },
  [UpgradeMaterial.ICE_CRYSTAL]: {
    id: UpgradeMaterial.ICE_CRYSTAL,
    name: 'Ice Crystal',
    icon: '❄️🔹',
    description: 'Frozen shard from the eternal winter realm',
    rarity: EquipmentRarity.RARE,
    source: 'Ice Queen'
  },
  [UpgradeMaterial.SHADOW_ORB]: {
    id: UpgradeMaterial.SHADOW_ORB,
    name: 'Shadow Orb',
    icon: '🌑🔮',
    description: 'Condensed darkness that absorbs light',
    rarity: EquipmentRarity.EPIC,
    source: 'Shadow Lord'
  },
  [UpgradeMaterial.EARTH_FRAGMENT]: {
    id: UpgradeMaterial.EARTH_FRAGMENT,
    name: 'Earth Fragment',
    icon: '⛰️💎',
    description: 'Core piece of ancient mountains',
    rarity: EquipmentRarity.UNCOMMON,
    source: 'Earth Titan'
  },
  [UpgradeMaterial.MYSTIC_DUST]: {
    id: UpgradeMaterial.MYSTIC_DUST,
    name: 'Mystic Dust',
    icon: '✨💫',
    description: 'Universal material that enhances any equipment',
    rarity: EquipmentRarity.COMMON,
    source: 'All Bosses'
  }
};

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
    id: `${templateId}_${rarity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
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

export const getUpgradeCost = (equipment: Equipment): { gold: number; materials: Record<UpgradeMaterial, number> } => {
  const level = equipment.level;
  const rarity = equipment.rarity;
  
  // Base gold cost scaling
  const baseCost = 100;
  const rarityMultiplier = Object.values(EquipmentRarity).indexOf(rarity) + 1;
  const goldCost = baseCost * rarityMultiplier * Math.pow(1.8, level);

  // Material requirements based on level tiers
  const materials: Record<UpgradeMaterial, number> = {
    [UpgradeMaterial.FIRE_ESSENCE]: 0,
    [UpgradeMaterial.ICE_CRYSTAL]: 0,
    [UpgradeMaterial.SHADOW_ORB]: 0,
    [UpgradeMaterial.EARTH_FRAGMENT]: 0,
    [UpgradeMaterial.MYSTIC_DUST]: 0,
  };

  // Always require mystic dust
  materials[UpgradeMaterial.MYSTIC_DUST] = Math.max(1, Math.floor(level / 3) + 1);

  // Higher level requirements (levels 10-25)
  if (level >= 10) {
    // Determine material based on equipment source
    const sourceMaterial = getSourceMaterial(equipment);
    if (sourceMaterial) {
      materials[sourceMaterial] = Math.floor((level - 10) / 2) + 1;
    }
  }

  // Epic level requirements (levels 20-25)
  if (level >= 20) {
    materials[UpgradeMaterial.MYSTIC_DUST] += Math.floor((level - 20) / 2) + 2;
    // Add second material requirement for top-tier upgrades
    const secondaryMaterial = getSecondaryMaterial(equipment);
    if (secondaryMaterial) {
      materials[secondaryMaterial] = Math.floor((level - 20) / 3) + 1;
    }
  }

  return {
    gold: Math.floor(goldCost),
    materials
  };
};

// Helper function to get source material for equipment
const getSourceMaterial = (equipment: Equipment): UpgradeMaterial | null => {
  if (equipment.sourceName?.includes('Fire Dragon')) return UpgradeMaterial.FIRE_ESSENCE;
  if (equipment.sourceName?.includes('Ice Queen')) return UpgradeMaterial.ICE_CRYSTAL;
  if (equipment.sourceName?.includes('Shadow Lord')) return UpgradeMaterial.SHADOW_ORB;
  if (equipment.sourceName?.includes('Earth Titan')) return UpgradeMaterial.EARTH_FRAGMENT;
  return null;
};

// Helper function to get secondary material for high-level upgrades
const getSecondaryMaterial = (equipment: Equipment): UpgradeMaterial | null => {
  // Cross-boss materials for highest tier upgrades
  switch (equipment.sourceName) {
    case 'Fire Dragon': return UpgradeMaterial.ICE_CRYSTAL; // Fire needs ice balance
    case 'Ice Queen': return UpgradeMaterial.FIRE_ESSENCE; // Ice needs fire balance
    case 'Shadow Lord': return UpgradeMaterial.EARTH_FRAGMENT; // Shadow needs earth grounding
    case 'Earth Titan': return UpgradeMaterial.SHADOW_ORB; // Earth needs shadow flexibility
    default: return null;
  }
};

export const canUpgradeEquipment = (equipment: Equipment): boolean => {
  return equipment.level < 25; // Max level 25 (increased from 10)
};