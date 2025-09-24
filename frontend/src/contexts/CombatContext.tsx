import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { combatEngine, StatusEffectManager, DamageCalculator, CombatStats } from '../engine/CombatEngine';
import { AbilityManager, EquippedAbility, AbilityDeck } from '../types/AbilityTypes';
import { useGame } from './GameContext';

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

let enemyCounter = 0; // Global counter for unique enemy IDs

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

  // Function to handle enemy kills - just log for now, main component will handle rewards
  const handleEnemyKill = (enemy: CombatEnemy) => {
    console.log(`🎯 Enemy killed! Max HP: ${enemy.maxHealth}`);
    
    // Award XP and gold directly using useGame hook
    const xpReward = 50;
    const goldReward = 10;
    
    console.log(`💰 Awarding ${xpReward} XP and ${goldReward} gold for kill`);
    
    updateNinja((prev) => {
      console.log(`📊 XP before: ${prev.experience}, after: ${prev.experience + xpReward}`);
      return {
        experience: prev.experience + xpReward,
        gold: prev.gold + goldReward,
      };
    });
  };

  // Combat tick handler
  const handleCombatTick = () => {
    console.log('🔄 Combat tick running...');
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

      // Maintain 10 enemies on screen
      const MAX_ENEMIES = 10;
      console.log(`🐛 Enemy spawn check: Current=${newState.enemies.length}, Max=${MAX_ENEMIES}`);
      while (newState.enemies.length < MAX_ENEMIES) {
        console.log(`🐛 Spawning enemy ${newState.enemies.length + 1}/${MAX_ENEMIES}`);
        spawnTestEnemy(newState);
      }

      return newState;
    });
  };

  // Find closest enemy to ninja
  const findClosestEnemy = (enemies: CombatEnemy[]): CombatEnemy | null => {
    if (enemies.length === 0) return null;
    
    // Ninja position (center of screen)
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 250;
    const ninjaX = SCREEN_WIDTH / 2;
    const ninjaY = GAME_AREA_HEIGHT / 2;
    
    let closestEnemy = enemies[0];
    let closestDistance = Infinity;
    
    enemies.forEach(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - ninjaX, 2) + 
        Math.pow(enemy.position.y - ninjaY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });
    
    console.log(`🎯 Targeting closest enemy at distance ${closestDistance.toFixed(0)}`);
    return closestEnemy;
  };

  // Cast ability and apply effects
  const castAbility = (state: CombatState, slotIndex: number) => {
    const deck = state.abilityManager.getDeck();
    const ability = deck.slots[slotIndex];
    if (!ability) return;

    // Find target (closest enemy)
    const target = findClosestEnemy(state.enemies);
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
    // Get screen dimensions for proper positioning
    const SCREEN_WIDTH = 390; // Mobile width
    const GAME_AREA_HEIGHT = 844 - 250; // Screen height minus bottom tabs
    const ENEMY_SIZE = 35;
    
    // Random position within game area bounds (like ninja positioning)
    const x = Math.random() * (SCREEN_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE; // Avoid edges
    const y = Math.random() * (GAME_AREA_HEIGHT - ENEMY_SIZE * 2) + ENEMY_SIZE; // Avoid edges
    
    const enemy: CombatEnemy = {
      id: `enemy_${++enemyCounter}`,
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
      position: { x, y },
      lastDamaged: 0,
    };
    
    state.enemies.push(enemy);
  };

  // Start combat
  const startCombat = () => {
    console.log('🚀 Starting combat, adding tick callback...');
    setCombatState(prev => ({ ...prev, isInCombat: true }));
    
    // Add tick callback if not already added
    combatEngine.addTickCallback(handleCombatTick);
    console.log('🚀 Tick callback added, starting engine...');
    
    // Start the engine
    combatEngine.start();
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
  };

  return (
    <CombatContext.Provider value={contextValue}>
      {children}
    </CombatContext.Provider>
  );
};