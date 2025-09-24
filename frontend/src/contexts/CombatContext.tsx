import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { combatEngine, StatusEffectManager, DamageCalculator, CombatStats } from '../engine/CombatEngine';
import { AbilityManager, EquippedAbility, AbilityDeck } from '../types/AbilityTypes';
import { useGame } from './GameContext';
import { useZone } from './ZoneContext';

interface CombatState {
  isInCombat: boolean;
  currentTick: number;
  enemies: CombatEnemy[];
  abilityManager: AbilityManager;
  statusEffects: StatusEffectManager;
  playerStats: CombatStats;
  lastSpawnTime?: number;
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

interface CombatProjectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: string;
  damage: number;
  startTime: number;
  duration: number;
}

interface CombatContextType {
  combatState: CombatState;
  projectiles: CombatProjectile[];
  startCombat: () => void;
  stopCombat: () => void;
  equipAbility: (abilityId: string, slotIndex: number) => boolean;
  getDeck: () => AbilityDeck;
  getAvailableAbilities: () => any[];
  upgradeAbility: (abilityId: string) => boolean;
  // Enhanced enemy spawning and management
  spawnEnemy: (position?: { x: number; y: number }) => CombatEnemy;
  spawnBoss: (bossEnemy: CombatEnemy) => void;
  clearAllEnemies: () => void; // For level-up explosion
  clearSpecificEnemy: (enemyId: string) => void;
  triggerLevelUpExplosion: () => void; // Trigger explosion from combat context
  findClosestEnemy: () => CombatEnemy | null; // Expose closest enemy finding
  updateNinjaPosition: (position: {x: number, y: number}) => void; // Update ninja position for projectiles
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
  const { recordEnemyKill } = useZone();
  
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
  
  const [projectiles, setProjectiles] = useState<CombatProjectile[]>([]);
  // Initialize ninja position to match game's starting position (bottom left corner)
  const SCREEN_WIDTH = 390;
  const GAME_AREA_HEIGHT = 844 - 250;
  const NINJA_SIZE = 40;
  const [ninjaPosition, setNinjaPosition] = useState<{x: number, y: number}>({ 
    x: 50, 
    y: GAME_AREA_HEIGHT - NINJA_SIZE - 50 
  });

  // Function to handle enemy kills - integrates with zone progression and awards XP/gold
  const handleEnemyKill = (enemy: CombatEnemy) => {
    console.log(`🎯 Enemy killed! Max HP: ${enemy.maxHealth}`);
    
    // Convert CombatEnemy to CurrentEnemy format for zone progression
    const zoneEnemy = {
      id: enemy.id,
      typeId: 'test_orc', // Default type for test enemies
      name: enemy.name,
      icon: '🧌', // Default icon for test enemies
      hp: 0, // Dead enemy
      maxHP: enemy.maxHealth,
      attack: enemy.stats.attack,
      xp: 20, // Base XP reward - updated to 20
      position: enemy.position
    };
    
    // Record the kill for zone progression
    recordEnemyKill(zoneEnemy);
    
    // Award XP and gold directly using useGame hook
    const xpReward = 20; // Base XP reward per kill
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

      // Maintain 10 enemies on screen with slower respawn to prevent chaos
      const MAX_ENEMIES = 10;
      const MIN_SPAWN_DELAY = 500; // Minimum 500ms between spawns
      const now = Date.now();
      
      // Add respawn cooldown tracking
      if (!newState.lastSpawnTime) {
        newState.lastSpawnTime = now;
      }
      
      console.log(`🐛 Enemy spawn check: Current=${newState.enemies.length}, Max=${MAX_ENEMIES}`);
      if (newState.enemies.length < MAX_ENEMIES && (now - newState.lastSpawnTime) >= MIN_SPAWN_DELAY) {
        console.log(`🐛 Spawning enemy ${newState.enemies.length + 1}/${MAX_ENEMIES}`);
        spawnTestEnemy(newState);
        newState.lastSpawnTime = now;
      }

      return newState;
    });
  };

  // Find closest enemy to ninja - exposed for UI use
  const findClosestEnemyInternal = (enemies: CombatEnemy[]): CombatEnemy | null => {
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

  // Public function to find closest enemy from current combat state
  const findClosestEnemy = (): CombatEnemy | null => {
    return findClosestEnemyInternal(combatState.enemies);
  };

  // Update ninja position for accurate projectile origin
  const updateNinjaPosition = (position: {x: number, y: number}) => {
    console.log(`🎯 Combat context ninja position updated to: (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
    setNinjaPosition(position);
  };

  // Handle projectile hit - deals damage to target enemy
  const handleProjectileHit = (projectile: CombatProjectile) => {
    console.log(`💥 Projectile ${projectile.id} hit enemy ${projectile.targetEnemyId} for ${projectile.damage} damage`);
    
    setCombatState(prev => {
      const newState = { ...prev };
      
      // Find the target enemy and deal damage
      const enemyIndex = newState.enemies.findIndex(e => e.id === projectile.targetEnemyId);
      if (enemyIndex >= 0) {
        newState.enemies = [...newState.enemies];
        newState.enemies[enemyIndex] = {
          ...newState.enemies[enemyIndex],
          health: newState.enemies[enemyIndex].health - projectile.damage,
          lastDamaged: combatEngine.getCurrentTick()
        };
        
        console.log(`🎯 Enemy ${projectile.targetEnemyId} health: ${newState.enemies[enemyIndex].health}/${newState.enemies[enemyIndex].maxHealth}`);
      }
      
      return newState;
    });
    
    // Remove projectile after hit
    setProjectiles(prev => prev.filter(p => p.id !== projectile.id));
  };

  // Cast ability and apply effects
  const castAbility = (state: CombatState, slotIndex: number) => {
    const deck = state.abilityManager.getDeck();
    const ability = deck.slots[slotIndex];
    if (!ability) return;

    // Find target (closest enemy)
    const target = findClosestEnemyInternal(state.enemies);
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

    // Create projectile for visual effect and delayed damage
    createProjectile(target, damageResult.damage, ninjaPosition);

    // Apply DoT effects (immediate)
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

    console.log(`🎯 ${ability.name} cast! Projectile created for ${damageResult.damage} damage${damageResult.isCritical ? ' (CRIT!)' : ''}`);
  };

  // Create projectile that will deal damage when it hits
  const createProjectile = (targetEnemy: CombatEnemy, damage: number, ninjaPos?: {x: number, y: number}) => {
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 250;
    const NINJA_SIZE = 40;
    
    // Use provided ninja position or default to center
    const ninjaX = ninjaPos ? ninjaPos.x + NINJA_SIZE / 2 : SCREEN_WIDTH / 2;
    const ninjaY = ninjaPos ? ninjaPos.y + NINJA_SIZE / 2 : GAME_AREA_HEIGHT / 2;
    const ENEMY_SIZE = 35;
    
    const projectile: CombatProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      x: ninjaX,
      y: ninjaY,
      targetX: targetEnemy.position.x + ENEMY_SIZE / 2,
      targetY: targetEnemy.position.y + ENEMY_SIZE / 2,
      targetEnemyId: targetEnemy.id,
      damage: damage,
      startTime: Date.now(),
      duration: 500, // 500ms travel time
    };
    
    console.log(`🔥 Creating projectile to enemy ${targetEnemy.id} for ${damage} damage`);
    console.log(`🎯 Projectile origin: ninja at (${ninjaX}, ${ninjaY}), target at (${projectile.targetX}, ${projectile.targetY})`);
    
    setProjectiles(prev => [...prev, projectile]);
    
    // Schedule projectile hit
    setTimeout(() => {
      handleProjectileHit(projectile);
    }, 500);
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

  // Clear all enemies (for level-up explosion)
  const clearAllEnemies = () => {
    console.log('💥 Clearing all enemies for level-up explosion!');
    setCombatState(prev => ({
      ...prev,
      enemies: []
    }));
  };

  // Trigger level-up explosion that actually damages enemies
  const triggerLevelUpExplosion = () => {
    console.log('💥 LEVEL UP EXPLOSION TRIGGERED IN COMBAT CONTEXT!');
    
    setCombatState(prev => {
      // Calculate rewards for all current enemies
      const enemyCount = prev.enemies.length;
      const explosionXP = enemyCount * 20; // Base XP reward per enemy in explosion
      const explosionGold = enemyCount * 5; // 5 gold per enemy
      
      console.log(`💥 Explosion killing ${enemyCount} enemies, awarding ${explosionXP} XP and ${explosionGold} gold`);
      
      // Award XP using updateNinja if there are enemies to kill
      if (explosionXP > 0) {
        updateNinja((ninja) => ({
          experience: ninja.experience + explosionXP,
          gold: ninja.gold + explosionGold,
        }));
      }
      
      // Actually damage all enemies to 0 health instead of just clearing them
      // This will trigger the normal kill processing in the next tick
      const damagedEnemies = prev.enemies.map(enemy => ({
        ...enemy,
        health: 0, // Set health to 0 to trigger normal kill processing
        lastDamaged: combatEngine.getCurrentTick()
      }));
      
      return {
        ...prev,
        enemies: damagedEnemies
      };
    });
  };

  // Enhanced enemy spawning function
  const spawnEnemy = (position?: { x: number; y: number }): CombatEnemy => {
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 250;
    const ENEMY_SIZE = 35;
    
    // Use provided position or generate random position
    const x = position?.x ?? Math.random() * (SCREEN_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE;
    const y = position?.y ?? Math.random() * (GAME_AREA_HEIGHT - ENEMY_SIZE * 2) + ENEMY_SIZE;
    
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
    
    setCombatState(prev => ({
      ...prev,
      enemies: [...prev.enemies, enemy]
    }));
    
    return enemy;
  };

  // Spawn boss enemy function
  const spawnBoss = (bossEnemy: CombatEnemy) => {
    setCombatState(prev => ({
      ...prev,
      enemies: [...prev.enemies, bossEnemy]
    }));
  };

  // Clear specific enemy by ID
  const clearSpecificEnemy = (enemyId: string) => {
    setCombatState(prev => ({
      ...prev,
      enemies: prev.enemies.filter(enemy => enemy.id !== enemyId)
    }));
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
    projectiles,
    startCombat,
    stopCombat,
    equipAbility,
    getDeck,
    getAvailableAbilities,
    upgradeAbility,
    spawnEnemy,
    spawnBoss,
    clearAllEnemies,
    clearSpecificEnemy,
    triggerLevelUpExplosion,
    findClosestEnemy,
    updateNinjaPosition,
  };

  return (
    <CombatContext.Provider value={contextValue}>
      {children}
    </CombatContext.Provider>
  );
};