import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Boss, 
  BossType, 
  BossTier, 
  BOSS_DATA, 
  DailyBossState, 
  DAILY_BOSS_CONFIG 
} from '../data/BossData';
import { 
  Equipment, 
  EquipmentRarity, 
  UpgradeMaterial,
  generateEquipment 
} from '../data/EquipmentData';
import { useGame } from './GameContext';
import { useEquipment } from './EquipmentContext';
import { useMaterials } from './MaterialsContext';

interface BossContextType {
  // Boss State
  dailyBossState: DailyBossState;
  
  // Boss Battle Management
  canFightBoss: (bossType: BossType, tier: number) => boolean;
  fightBoss: (bossType: BossType, tier: number) => Promise<BossBattleResult>;
  unlockNextTier: (bossType: BossType, tier: number) => boolean;
  
  // Ticket Management
  getTicketsRemaining: () => number;
  getTimeUntilTicketRegen: () => number;
  hasTickets: () => boolean;
  
  // Boss Information
  getBoss: (bossType: BossType) => Boss;
  getBossTier: (bossType: BossType, tier: number) => BossTier | null;
  getAvailableBosses: () => Boss[];
  getBossProgress: (bossType: BossType) => { highestTier: number; totalVictories: number };
  
  // Utility Functions
  resetDailyTickets: () => void;
  addTestMaterials: () => void; // For testing/development
}

interface BossBattleResult {
  victory: boolean;
  rewards: {
    gold: number;
    experience: number;
    equipment?: Equipment;
    materials: Record<UpgradeMaterial, number>;
  };
  message: string;
}

const BossContext = createContext<BossContextType | undefined>(undefined);

export const useBoss = () => {
  const context = useContext(BossContext);
  if (!context) {
    throw new Error('useBoss must be used within a BossProvider');
  }
  return context;
};

export const BossProvider = ({ children }: { children: ReactNode }) => {
  const { updateNinja, gameState } = useGame();
  const { addToInventory, generateRandomEquipment } = useEquipment();
  const { addMaterial } = useMaterials();

  // Extract ninja from gameState
  const ninja = gameState.ninja;

  // Initialize daily boss state
  const [dailyBossState, setDailyBossState] = useState<DailyBossState>({
    ticketsRemaining: DAILY_BOSS_CONFIG.maxTickets,
    maxTickets: DAILY_BOSS_CONFIG.maxTickets,
    lastResetTime: Date.now(),
    bossProgress: {
      [BossType.FIRE_DRAGON]: {
        highestTierDefeated: 0,
        totalVictories: 0,
        unlockedTiers: [1] // Tier 1 always unlocked
      },
      [BossType.ICE_QUEEN]: {
        highestTierDefeated: 0,
        totalVictories: 0,
        unlockedTiers: [1] // Tier 1 always unlocked
      },
      [BossType.SHADOW_LORD]: {
        highestTierDefeated: 0,
        totalVictories: 0,
        unlockedTiers: [1] // Tier 1 always unlocked
      },
      [BossType.EARTH_TITAN]: {
        highestTierDefeated: 0,
        totalVictories: 0,
        unlockedTiers: [1] // Tier 1 always unlocked
      }
    }
  });

  // Check for daily reset
  useEffect(() => {
    const checkDailyReset = () => {
      const now = Date.now();
      const timeSinceReset = now - dailyBossState.lastResetTime;
      const millisecondsInDay = 24 * 60 * 60 * 1000;
      
      if (timeSinceReset >= millisecondsInDay) {
        resetDailyTickets();
      }
    };

    const interval = setInterval(checkDailyReset, 60000); // Check every minute
    checkDailyReset(); // Check immediately
    
    return () => clearInterval(interval);
  }, [dailyBossState.lastResetTime]);

  // Check if player can fight a specific boss tier
  const canFightBoss = (bossType: BossType, tier: number): boolean => {
    // Check if ninja data is available
    if (!ninja) {
      return false; // No ninja data available
    }
    
    const bossProgress = dailyBossState.bossProgress[bossType];
    const bossTier = getBossTier(bossType, tier);
    
    if (!bossTier || !bossProgress.unlockedTiers.includes(tier)) {
      return false; // Tier not unlocked
    }
    
    if (dailyBossState.ticketsRemaining <= 0) {
      return false; // No tickets remaining
    }
    
    // Double-check ninja is still available before accessing properties
    if (!ninja || typeof ninja.level !== 'number') {
      return false; // Player data not available or invalid
    }
    
    if (ninja.level < bossTier.requiredLevel) {
      return false; // Player level too low
    }
    
    return true;
  };

  // Fight boss and return battle result
  const fightBoss = async (bossType: BossType, tier: number): Promise<BossBattleResult> => {
    if (!canFightBoss(bossType, tier)) {
      return {
        victory: false,
        rewards: { gold: 0, experience: 0, materials: {} as Record<UpgradeMaterial, number> },
        message: 'Cannot fight this boss!'
      };
    }

    // Check if ninja data is available (additional safety check)
    if (!ninja) {
      return {
        victory: false,
        rewards: { gold: 0, experience: 0, materials: {} as Record<UpgradeMaterial, number> },
        message: 'Player data not available!'
      };
    }

    // Consume ticket
    setDailyBossState(prev => ({
      ...prev,
      ticketsRemaining: prev.ticketsRemaining - 1
    }));

    const boss = getBoss(bossType);
    const bossTier = getBossTier(bossType, tier)!;
    
    // Simplified battle simulation - victory based on player level vs boss requirements
    // In a full implementation, this would be a complex combat calculation
    const playerPower = ninja.level * 100 + (ninja.attack || 0) + (ninja.defense || 0);
    const bossPower = bossTier.stats.hp + bossTier.stats.attack + bossTier.stats.defense;
    const victoryChance = Math.min(0.9, Math.max(0.1, playerPower / (bossPower + playerPower)));
    const victory = Math.random() < victoryChance;

    if (victory) {
      // Update boss progress
      setDailyBossState(prev => {
        const newState = { ...prev };
        const bossProgress = { ...newState.bossProgress[bossType] };
        
        bossProgress.totalVictories += 1;
        bossProgress.highestTierDefeated = Math.max(bossProgress.highestTierDefeated, tier);
        
        // Unlock next tier if available
        if (tier < 5 && !bossProgress.unlockedTiers.includes(tier + 1)) {
          bossProgress.unlockedTiers.push(tier + 1);
        }
        
        newState.bossProgress[bossType] = bossProgress;
        return newState;
      });

      // Generate rewards
      const rewards = generateBossRewards(boss, bossTier);
      
      // Apply rewards
      updateNinja(prev => ({
        experience: prev.experience + rewards.experience,
        gold: prev.gold + rewards.gold
      }));

      // Add equipment to inventory
      if (rewards.equipment) {
        addToInventory(rewards.equipment);
      }

      // Add materials to inventory
      Object.entries(rewards.materials).forEach(([material, quantity]) => {
        if (quantity > 0) {
          addMaterial(material as UpgradeMaterial, quantity);
        }
      });

      console.log(`🏆 Victory against ${boss.name} - ${bossTier.name}!`);
      console.log(`💰 Rewards: ${rewards.gold} gold, ${rewards.experience} XP`);
      
      return {
        victory: true,
        rewards,
        message: `Victory! Defeated ${bossTier.name}!`
      };
    } else {
      console.log(`💀 Defeated by ${boss.name} - ${bossTier.name}`);
      return {
        victory: false,
        rewards: { 
          gold: Math.floor(bossTier.rewards.goldMin * 0.1), 
          experience: Math.floor(bossTier.rewards.experienceMin * 0.1),
          materials: {} as Record<UpgradeMaterial, number>
        },
        message: `Defeated by ${bossTier.name}. Try again when stronger!`
      };
    }
  };

  // Generate boss rewards
  const generateBossRewards = (boss: Boss, bossTier: BossTier) => {
    const goldReward = Math.floor(
      bossTier.rewards.goldMin + 
      Math.random() * (bossTier.rewards.goldMax - bossTier.rewards.goldMin)
    );
    
    const experienceReward = Math.floor(
      bossTier.rewards.experienceMin + 
      Math.random() * (bossTier.rewards.experienceMax - bossTier.rewards.experienceMin)
    );

    // Generate equipment (guaranteed for bosses)
    let equipment: Equipment | undefined;
    if (bossTier.rewards.guaranteedEquipment && bossTier.rewards.equipmentTemplates.length > 0) {
      const randomTemplate = bossTier.rewards.equipmentTemplates[
        Math.floor(Math.random() * bossTier.rewards.equipmentTemplates.length)
      ];
      
      // Higher tiers have better rarity chances
      const rarityWeights = {
        1: [0.7, 0.25, 0.05, 0.0, 0.0],  // Tier 1: 70% common, 25% uncommon, 5% rare
        2: [0.5, 0.35, 0.15, 0.0, 0.0],  // Tier 2: 50% common, 35% uncommon, 15% rare
        3: [0.3, 0.4, 0.25, 0.05, 0.0],  // Tier 3: 30% common, 40% uncommon, 25% rare, 5% epic
        4: [0.1, 0.3, 0.4, 0.2, 0.0],    // Tier 4: 10% common, 30% uncommon, 40% rare, 20% epic
        5: [0.05, 0.15, 0.3, 0.35, 0.15] // Tier 5: 5% common, 15% uncommon, 30% rare, 35% epic, 15% legendary
      };
      
      const weights = rarityWeights[bossTier.tier as keyof typeof rarityWeights];
      const rarity = selectWeightedRarity(weights);
      
      equipment = generateEquipment(randomTemplate, rarity);
    }

    // Generate materials
    const materials: Record<UpgradeMaterial, number> = {
      [UpgradeMaterial.FIRE_ESSENCE]: 0,
      [UpgradeMaterial.ICE_CRYSTAL]: 0,
      [UpgradeMaterial.SHADOW_ORB]: 0,
      [UpgradeMaterial.EARTH_FRAGMENT]: 0,
      [UpgradeMaterial.MYSTIC_DUST]: 0,
    };

    Object.entries(bossTier.rewards.materials).forEach(([material, range]) => {
      const quantity = Math.floor(range.min + Math.random() * (range.max - range.min + 1));
      materials[material as UpgradeMaterial] = quantity;
    });

    return {
      gold: goldReward,
      experience: experienceReward,
      equipment,
      materials
    };
  };

  // Helper function to select weighted rarity
  const selectWeightedRarity = (weights: number[]): EquipmentRarity => {
    const rarities = [
      EquipmentRarity.COMMON,
      EquipmentRarity.UNCOMMON,
      EquipmentRarity.RARE,
      EquipmentRarity.EPIC,
      EquipmentRarity.LEGENDARY
    ];
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return rarities[i];
      }
    }
    
    return EquipmentRarity.COMMON; // Fallback
  };

  // Unlock next tier for a boss
  const unlockNextTier = (bossType: BossType, tier: number): boolean => {
    if (tier >= 5) return false; // No tier 6
    
    const bossProgress = dailyBossState.bossProgress[bossType];
    if (bossProgress.highestTierDefeated >= tier && !bossProgress.unlockedTiers.includes(tier + 1)) {
      setDailyBossState(prev => {
        const newState = { ...prev };
        newState.bossProgress[bossType].unlockedTiers.push(tier + 1);
        return newState;
      });
      return true;
    }
    return false;
  };

  // Get remaining tickets
  const getTicketsRemaining = (): number => {
    return dailyBossState.ticketsRemaining;
  };

  // Get time until next ticket regeneration
  const getTimeUntilTicketRegen = (): number => {
    const now = Date.now();
    const timeSinceReset = now - dailyBossState.lastResetTime;
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    return Math.max(0, millisecondsInDay - timeSinceReset);
  };

  // Check if player has tickets
  const hasTickets = (): boolean => {
    return dailyBossState.ticketsRemaining > 0;
  };

  // Get boss data
  const getBoss = (bossType: BossType): Boss => {
    return BOSS_DATA[bossType];
  };

  // Get specific boss tier
  const getBossTier = (bossType: BossType, tier: number): BossTier | null => {
    const boss = getBoss(bossType);
    return boss.tiers.find(t => t.tier === tier) || null;
  };

  // Get all available bosses
  const getAvailableBosses = (): Boss[] => {
    return Object.values(BOSS_DATA);
  };

  // Get boss progress
  const getBossProgress = (bossType: BossType) => {
    const progress = dailyBossState.bossProgress[bossType];
    return {
      highestTier: progress.highestTierDefeated,
      totalVictories: progress.totalVictories
    };
  };

  // Reset daily tickets
  const resetDailyTickets = () => {
    setDailyBossState(prev => ({
      ...prev,
      ticketsRemaining: DAILY_BOSS_CONFIG.maxTickets,
      lastResetTime: Date.now()
    }));
    console.log('🎟️ Daily boss tickets reset!');
  };

  // Add test materials for development
  const addTestMaterials = () => {
    addMaterial(UpgradeMaterial.FIRE_ESSENCE, 5);
    addMaterial(UpgradeMaterial.ICE_CRYSTAL, 5);
    addMaterial(UpgradeMaterial.SHADOW_ORB, 3);
    addMaterial(UpgradeMaterial.EARTH_FRAGMENT, 5);
    addMaterial(UpgradeMaterial.MYSTIC_DUST, 10);
    console.log('🧪 Test materials added!');
  };

  const contextValue: BossContextType = {
    dailyBossState,
    canFightBoss,
    fightBoss,
    unlockNextTier,
    getTicketsRemaining,
    getTimeUntilTicketRegen,
    hasTickets,
    getBoss,
    getBossTier,
    getAvailableBosses,
    getBossProgress,
    resetDailyTickets,
    addTestMaterials,
  };

  return (
    <BossContext.Provider value={contextValue}>
      {children}
    </BossContext.Provider>
  );
};