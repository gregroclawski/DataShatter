// Comprehensive Ability System Types

export type AbilityEffect = 
  | 'SingleTarget' 
  | 'AoE' 
  | 'DoT' 
  | 'Buff' 
  | 'Debuff' 
  | 'Heal' 
  | 'Piercing'
  | 'Shield'
  | 'Stun';

export type AbilityRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AbilityStats {
  baseDamage: number;
  cooldown: number; // in seconds
  manaCost?: number;
  range?: number;
  aoeRadius?: number;
  duration?: number; // for DoTs, buffs, etc.
  critChance?: number;
  critMultiplier?: number;
}

export interface AbilityUpgrade {
  level: number;
  damageMultiplier: number;
  cooldownReduction: number; // percentage
  additionalEffects?: AbilityEffect[];
  cost: {
    gold: number;
    materials?: { [key: string]: number };
  };
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AbilityRarity;
  level: number;
  maxLevel: number;
  effects: AbilityEffect[];
  stats: AbilityStats;
  upgrades: AbilityUpgrade[];
  synergies?: string[]; // IDs of abilities that synergize
  tags: string[]; // for synergy system (e.g., "fire", "ninja", "shadow")
}

export interface EquippedAbility extends Ability {
  slotIndex: number; // 0-4 for the 5 deck slots
  currentCooldown: number; // remaining cooldown in ticks
  lastUsed: number; // tick when last used
}

export interface AbilitySynergy {
  id: string;
  name: string;
  description: string;
  requiredTags: string[];
  requiredCount: number; // how many abilities with these tags needed
  bonus: {
    damageBonus?: number; // percentage
    cooldownReduction?: number; // percentage
    critChance?: number; // flat bonus
    specialEffect?: string;
  };
}

// Pre-defined abilities for the ninja game
export const BASE_ABILITIES: Ability[] = [
  {
    id: 'basic_shuriken',
    name: 'Basic Shuriken',
    description: 'A simple throwing star that deals moderate damage.',
    icon: '🌟',
    rarity: 'common',
    level: 1,
    maxLevel: 10,
    effects: ['SingleTarget'],
    stats: {
      baseDamage: 25,
      cooldown: 2.0,
      range: 150,
    },
    upgrades: [
      { level: 2, damageMultiplier: 1.2, cooldownReduction: 5, cost: { gold: 100 } },
      { level: 3, damageMultiplier: 1.4, cooldownReduction: 10, cost: { gold: 250 } },
      { level: 4, damageMultiplier: 1.6, cooldownReduction: 15, cost: { gold: 500 } },
      { level: 5, damageMultiplier: 1.8, cooldownReduction: 20, cost: { gold: 1000 } },
    ],
    synergies: ['shadow_techniques'],
    tags: ['ninja', 'projectile', 'basic'],
  },
  {
    id: 'fire_shuriken',
    name: 'Fire Shuriken',
    description: 'Burning shuriken that deals damage over time.',
    icon: '🔥',
    rarity: 'uncommon',
    level: 1,
    maxLevel: 10,
    effects: ['SingleTarget', 'DoT'],
    stats: {
      baseDamage: 20,
      cooldown: 3.0,
      range: 150,
      duration: 5, // DoT lasts 5 seconds
    },
    upgrades: [
      { level: 2, damageMultiplier: 1.3, cooldownReduction: 8, cost: { gold: 200 } },
      { level: 3, damageMultiplier: 1.6, cooldownReduction: 15, cost: { gold: 500 } },
    ],
    synergies: ['elemental_mastery'],
    tags: ['ninja', 'fire', 'dot', 'elemental'],
  },
  {
    id: 'shadow_clone',
    name: 'Shadow Clone',
    description: 'Creates a shadow clone that fights alongside you.',
    icon: '👥',
    rarity: 'rare',
    level: 1,
    maxLevel: 8,
    effects: ['Buff'],
    stats: {
      baseDamage: 0,
      cooldown: 15.0,
      duration: 30, // Clone lasts 30 seconds
    },
    upgrades: [
      { level: 2, damageMultiplier: 1.0, cooldownReduction: 10, cost: { gold: 1000 } },
    ],
    synergies: ['shadow_techniques'],
    tags: ['ninja', 'shadow', 'summon', 'buff'],
  },
  {
    id: 'whirlwind_strike',
    name: 'Whirlwind Strike',
    description: 'Spinning attack that hits all nearby enemies.',
    icon: '🌪️',
    rarity: 'epic',
    level: 1,
    maxLevel: 8,
    effects: ['AoE'],
    stats: {
      baseDamage: 40,
      cooldown: 8.0,
      aoeRadius: 100,
    },
    upgrades: [
      { level: 2, damageMultiplier: 1.4, cooldownReduction: 12, cost: { gold: 2000 } },
    ],
    synergies: ['combat_mastery'],
    tags: ['ninja', 'melee', 'aoe', 'physical'],
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    description: 'Piercing lightning that chains between enemies.',
    icon: '⚡',
    rarity: 'legendary',
    level: 1,
    maxLevel: 5,
    effects: ['Piercing', 'AoE'],
    stats: {
      baseDamage: 80,
      cooldown: 12.0,
      range: 200,
    },
    upgrades: [
      { level: 2, damageMultiplier: 1.5, cooldownReduction: 15, cost: { gold: 5000 } },
    ],
    synergies: ['elemental_mastery'],
    tags: ['ninja', 'lightning', 'piercing', 'elemental'],
  },
];

// Synergy definitions
export const ABILITY_SYNERGIES: AbilitySynergy[] = [
  {
    id: 'shadow_techniques',
    name: 'Shadow Techniques',
    description: 'Shadow abilities gain increased damage and reduced cooldowns.',
    requiredTags: ['shadow'],
    requiredCount: 2,
    bonus: {
      damageBonus: 25,
      cooldownReduction: 15,
    },
  },
  {
    id: 'elemental_mastery',
    name: 'Elemental Mastery',
    description: 'Elemental abilities have increased critical hit chance.',
    requiredTags: ['elemental'],
    requiredCount: 3,
    bonus: {
      critChance: 15,
      damageBonus: 20,
    },
  },
  {
    id: 'combat_mastery',
    name: 'Combat Mastery',
    description: 'Physical abilities gain attack speed and damage.',
    requiredTags: ['physical', 'melee'],
    requiredCount: 2,
    bonus: {
      damageBonus: 30,
      cooldownReduction: 20,
    },
  },
];

// Ability deck management
export interface AbilityDeck {
  slots: (EquippedAbility | null)[];
  activeSynergies: AbilitySynergy[];
}

export class AbilityManager {
  private deck: AbilityDeck;
  private availableAbilities: Map<string, Ability>;

  constructor() {
    this.deck = {
      slots: new Array(5).fill(null),
      activeSynergies: [],
    };
    
    this.availableAbilities = new Map();
    BASE_ABILITIES.forEach(ability => {
      this.availableAbilities.set(ability.id, { ...ability });
    });
    
    // Equip default abilities - one of each shuriken type
    this.equipAbility('basic_shuriken', 0); // Slot 1: Basic Shuriken
    this.equipAbility('fire_shuriken', 1);  // Slot 2: Fire Shuriken  
    this.equipAbility('shadow_clone', 2);   // Slot 3: Shadow Clone
  }

  // Equip ability to specific slot
  equipAbility(abilityId: string, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 5) return false;
    
    const ability = this.availableAbilities.get(abilityId);
    if (!ability) return false;

    const equippedAbility: EquippedAbility = {
      ...ability,
      slotIndex,
      currentCooldown: 0,
      lastUsed: 0,
    };

    this.deck.slots[slotIndex] = equippedAbility;
    this.updateSynergies();
    return true;
  }

  // Unequip ability from slot
  unequipAbility(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 5) return false;
    
    this.deck.slots[slotIndex] = null;
    this.updateSynergies();
    return true;
  }

  // Get current deck
  getDeck(): AbilityDeck {
    return { ...this.deck };
  }

  // Get available abilities
  getAvailableAbilities(): Ability[] {
    return Array.from(this.availableAbilities.values());
  }

  // Update ability cooldowns (called each tick)
  updateCooldowns(currentTick: number): void {
    this.deck.slots.forEach(ability => {
      if (ability && ability.currentCooldown > 0) {
        ability.currentCooldown--;
      }
    });
  }

  // Check if ability is ready to use
  isAbilityReady(slotIndex: number): boolean {
    const ability = this.deck.slots[slotIndex];
    return ability !== null && ability.currentCooldown <= 0;
  }

  // Use ability (returns true if successful)
  useAbility(slotIndex: number, currentTick: number): boolean {
    const ability = this.deck.slots[slotIndex];
    if (!ability || !this.isAbilityReady(slotIndex)) return false;

    // Calculate cooldown with synergy bonuses
    let cooldown = ability.stats.cooldown;
    
    // Apply cooldown reduction from synergies
    this.deck.activeSynergies.forEach(synergy => {
      if (synergy.bonus.cooldownReduction && 
          synergy.requiredTags.some(tag => ability.tags.includes(tag))) {
        cooldown *= (1 - synergy.bonus.cooldownReduction / 100);
      }
    });

    // Convert to ticks (10 TPS)
    ability.currentCooldown = Math.ceil(cooldown * 10);
    ability.lastUsed = currentTick;

    return true;
  }

  // Update active synergies based on equipped abilities
  private updateSynergies(): void {
    this.deck.activeSynergies = [];
    
    ABILITY_SYNERGIES.forEach(synergy => {
      const matchingAbilities = this.deck.slots.filter(ability => 
        ability && synergy.requiredTags.some(tag => ability.tags.includes(tag))
      );

      if (matchingAbilities.length >= synergy.requiredCount) {
        this.deck.activeSynergies.push(synergy);
      }
    });
  }

  // Upgrade ability
  upgradeAbility(abilityId: string): boolean {
    const ability = this.availableAbilities.get(abilityId);
    if (!ability || ability.level >= ability.maxLevel) return false;

    const upgrade = ability.upgrades.find(u => u.level === ability.level + 1);
    if (!upgrade) return false;

    // Apply upgrade
    ability.level++;
    ability.stats.baseDamage = Math.floor(ability.stats.baseDamage * upgrade.damageMultiplier);
    ability.stats.cooldown *= (1 - upgrade.cooldownReduction / 100);

    // Update equipped version if exists
    const equippedSlot = this.deck.slots.findIndex(slot => slot?.id === abilityId);
    if (equippedSlot >= 0) {
      this.equipAbility(abilityId, equippedSlot); // Re-equip with new stats
    }

    return true;
  }
}