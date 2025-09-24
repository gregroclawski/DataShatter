import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { combatEngine, StatusEffectManager, DamageCalculator, CombatStats } from '../engine/CombatEngine';
import { AbilityManager, EquippedAbility, AbilityDeck } from '../types/AbilityTypes';
import { useGame } from './GameContext';
import { useGame } from '../contexts/GameContext';

interface CombatState {
  isInCombat: boolean;
  currentTick: number;
  enemies: CombatEnemy[];
  abilityManager: AbilityManager;
  statusEffects: StatusEffectManager;
  playerStats: CombatStats;
}

interface CombatEnemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  stats: CombatStats;
  position: { x: number; y: number };
  lastDamaged: number;
}

interface CombatContextType {
  combatState: CombatState;
  startCombat: () => void;
  stopCombat: () => void;
  equipAbility: (abilityId: string, slotIndex: number) => boolean;
  getDeck: () => AbilityDeck;
  getAvailableAbilities: () => any[];
  upgradeAbility: (abilityId: string) => boolean;
}

const CombatContext = createContext<CombatContextType | undefined>(undefined);

export const useCombat = (): CombatContextType => {
  const context = useContext(CombatContext);
  if (!context) {
    throw new Error('useCombat must be used within a CombatProvider');
  }
  return context;
};

export const CombatProvider = ({ children }: { children: ReactNode }) => {
  const { updateNinja } = useGame();
  
  const [combatState, setCombatState] = useState<CombatState>({
    isInCombat: false,
    currentTick: 0,
    enemies: [],
    abilityManager: new AbilityManager(),
    statusEffects: new StatusEffectManager(),
    playerStats: {
      attack: 10, // Default stats - will be updated by game context
      defense: 5,
      health: 100,
      maxHealth: 100,
      critChance: 3,
      critDamage: 150,
      cooldownReduction: 0,
    },
  });

  // Function to handle enemy kills and reward XP
  const handleEnemyKill = (enemy: CombatEnemy) => {
    // Calculate XP reward based on enemy max health
    const baseXP = Math.floor(enemy.maxHealth * 0.5); // 0.5 XP per HP
    const goldReward = Math.floor(enemy.maxHealth * 0.1); // 0.1 gold per HP
    
    console.log(`🎯 Enemy killed! Rewarding ${baseXP} XP and ${goldReward} gold`);
    
    // Directly update ninja with rewards using functional update
    updateNinja((prev) => {
      const newXP = prev.experience + baseXP;
      const newGold = prev.gold + goldReward;
      console.log(`📊 XP Update: ${prev.experience} + ${baseXP} = ${newXP} (${newXP}/${prev.experienceToNext})`);
      return {
        experience: newXP,
        gold: newGold,
      };
    });
  };

  // Combat tick handler
  const handleCombatTick = () => {
    setCombatState(prev => {
      const newTick = combatEngine.getCurrentTick();
      const newState = { ...prev, currentTick: newTick };

      if (!newState.isInCombat) return newState;

      // Update ability cooldowns
      newState.abilityManager.updateCooldowns(newTick);

      // Process status effects
      const effectResults = newState.statusEffects.processTick(newTick);
      
      // Apply effect damage to enemies
      effectResults.forEach((results, entityId) => {
        const enemyIndex = newState.enemies.findIndex(e => e.id === entityId);
        if (enemyIndex >= 0) {
          results.forEach(result => {
            newState.enemies[enemyIndex].health -= result.damage;
            newState.enemies[enemyIndex].lastDamaged = newTick;
          });
        }
      });

      // Auto-cast abilities
      for (let i = 0; i < 5; i++) {
        if (newState.abilityManager.isAbilityReady(i) && newState.enemies.length > 0) {
          if (newState.abilityManager.useAbility(i, newTick)) {
            castAbility(newState, i);
          }
        }
      }

      // Handle dead enemies and reward XP
      const deadEnemies = newState.enemies.filter(enemy => enemy.health <= 0);
      deadEnemies.forEach(enemy => {
        handleEnemyKill(enemy);
      });
      
      // Remove dead enemies
      newState.enemies = newState.enemies.filter(enemy => enemy.health > 0);

      // Spawn new enemies if none remain (for testing)
      if (newState.enemies.length === 0) {
        spawnTestEnemy(newState);
      }

      return newState;
    });
  };

  // Cast ability and apply effects
  const castAbility = (state: CombatState, slotIndex: number) => {
    const deck = state.abilityManager.getDeck();
    const ability = deck.slots[slotIndex];
    if (!ability) return;

    // Find target (nearest enemy for now)
    const target = state.enemies[0];
    if (!target) return;

    // Calculate base damage
    let damage = ability.stats.baseDamage;
    
    // Apply synergy bonuses
    deck.activeSynergies.forEach(synergy => {
      if (synergy.bonus.damageBonus && 
          synergy.requiredTags.some(tag => ability.tags.includes(tag))) {
        damage *= (1 + synergy.bonus.damageBonus / 100);
      }
    });

    // Calculate final damage with stats
    const damageResult = DamageCalculator.calculateDamage(damage, state.playerStats, target.stats);

    // Apply damage based on ability effects
    if (ability.effects.includes('SingleTarget')) {
      target.health -= damageResult.damage;
      target.lastDamaged = state.currentTick;
    } else if (ability.effects.includes('AoE')) {
      // Damage all enemies
      state.enemies.forEach(enemy => {
        enemy.health -= Math.floor(damageResult.damage * 0.8); // 80% damage to secondary targets
        enemy.lastDamaged = state.currentTick;
      });
    }

    // Apply DoT effects
    if (ability.effects.includes('DoT') && ability.stats.duration) {
      state.statusEffects.addEffect(target.id, {
        id: `${ability.id}_dot`,
        type: 'dot',
        remainingTicks: Math.floor(ability.stats.duration * 10), // Convert seconds to ticks
        tickInterval: 10, // Every second
        lastTick: state.currentTick,
        value: Math.floor(damage * 0.3), // 30% of base damage per tick
        stackable: false,
      });
    }

    console.log(`🎯 ${ability.name} cast! Damage: ${damageResult.damage}${damageResult.isCritical ? ' (CRIT!)' : ''}`);
  };

  // Spawn a test enemy
  const spawnTestEnemy = (state: CombatState) => {
    const enemy: CombatEnemy = {
      id: `enemy_${Date.now()}`,
      name: 'Test Orc',
      health: 100,
      maxHealth: 100,
      stats: {
        attack: 30,
        defense: 10,
        health: 100,
        maxHealth: 100,
        critChance: 5,
        critDamage: 120,
        cooldownReduction: 0,
      },
      position: { x: 300, y: 200 },
      lastDamaged: 0,
    };
    
    state.enemies.push(enemy);
  };

  // Start combat
  const startCombat = () => {
    setCombatState(prev => ({ ...prev, isInCombat: true }));
    
    // Add tick callback if not already added
    combatEngine.addTickCallback(handleCombatTick);
    
    if (!combatEngine) {
      combatEngine.start();
    }
  };

  // Stop combat
  const stopCombat = () => {
    setCombatState(prev => ({ ...prev, isInCombat: false }));
    combatEngine.removeTickCallback(handleCombatTick);
  };

  // Equipment management
  const equipAbility = (abilityId: string, slotIndex: number): boolean => {
    return combatState.abilityManager.equipAbility(abilityId, slotIndex);
  };

  const getDeck = () => {
    return combatState.abilityManager.getDeck();
  };

  const getAvailableAbilities = () => {
    return combatState.abilityManager.getAvailableAbilities();
  };

  const upgradeAbility = (abilityId: string): boolean => {
    return combatState.abilityManager.upgradeAbility(abilityId);
  };

  // Initialize combat engine
  useEffect(() => {
    combatEngine.start();
    
    // Equip some default abilities for testing
    combatState.abilityManager.equipAbility('basic_shuriken', 0);
    combatState.abilityManager.equipAbility('fire_shuriken', 1);
    
    return () => {
      combatEngine.stop();
    };
  }, []);

  const contextValue: CombatContextType = {
    combatState,
    startCombat,
    stopCombat,
    equipAbility,
    getDeck,
    getAvailableAbilities,
    upgradeAbility,
    setRewardCallback: setRewardCallbackWithLogging,
  };

  return (
    <CombatContext.Provider value={contextValue}>
      {children}
    </CombatContext.Provider>
  );
};