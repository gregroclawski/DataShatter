import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { Animated, Dimensions, Platform } from 'react-native';
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
  abilities?: string[]; // Boss abilities
  isBoss?: boolean; // Mark as boss for special behavior
  element?: 'fire' | 'ice' | 'shadow' | 'earth'; // Boss element
  movementDirection?: { x: number; y: number }; // For mobile enemy movement
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
  // MOBILE ENHANCEMENT: Add ability information for visual representation
  abilityId: string;
  abilityName: string;
  abilityIcon: string; // Emoji icon of the ability (🌟🔥❄️☠️👥)
}

interface CombatContextType {
  combatState: CombatState;
  projectiles: CombatProjectile[];
  startCombat: () => void;
  stopCombat: () => void;
  equipAbility: (abilityId: string, slotIndex: number) => boolean;
  handleEnemyKill: (enemy: CombatEnemy) => void;
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
  lastExplosionTime: number;
  // Manual ability casting - MOBILE FIX
  useAbilityManually: (slotIndex: number) => boolean; // Manual ability activation for UI buttons
  // Manual control management
  setManualControlActive: (active: boolean) => void; // Pause/resume combat during manual joystick control
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
  const game = useGame();
  const { currentZone, currentZoneLevel, recordEnemyKill } = useZone();
  
  // Define initialCombatState before using it
  const initialCombatState: CombatState = {
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
  };
  
  const [combatState, setCombatState] = useState<CombatState>(() => {
    // Initialize with saved ability data from game context
    const initialState = { ...initialCombatState };
    
    // If we have saved ability data, restore it
    if (game.gameState.abilityData) {
      console.log('🔄 RESTORING ABILITY DATA FROM SAVE:', game.gameState.abilityData);
      initialState.abilityManager = new AbilityManager();
      initialState.abilityManager.restoreFromSaveData(game.gameState.abilityData);
    }
    
    return initialState;
  });
  
  const [projectiles, setProjectiles] = useState<CombatProjectile[]>([]);
  const [lastExplosionTime, setLastExplosionTime] = useState<number>(0);
  // MOBILE FIX: Removed duplicate ninja position state - using main game's position instead
  // Ninja position is now managed entirely by the main game component

  // Function to handle enemy kills - integrates with zone progression and awards XP/gold
  const handleEnemyKill = useCallback((enemy: CombatEnemy) => {
    console.log(`🗡️  MOBILE DEBUG - handleEnemyKill CALLED for enemy:`, enemy.id);
    
    // Award XP and gold directly using useGame hook
    const xpReward = 20; // Base XP reward per kill
    const goldReward = 10;
    
    console.log(`💰 MOBILE DEBUG - Awarding ${xpReward} XP and ${goldReward} gold for kill`);
    console.log(`📱 MOBILE DEBUG - Platform: ${Platform.OS}, Time: ${Date.now()}`);
    
    // MOBILE FIX: Defer ALL cross-context state updates to prevent render-phase violations
    // Use setTimeout to break the synchronous chain and prevent React Native bridge overload
    setTimeout(() => {
      console.log(`🥷 MOBILE DEBUG - About to call updateNinja with rewards`);
      
      // Award XP and gold using GameContext
      game.updateNinja((prev) => {
        console.log(`📊 MOBILE DEBUG - XP before: ${prev.experience}, after: ${prev.experience + xpReward}`);
        console.log(`💰 MOBILE DEBUG - Gold before: ${prev.gold}, after: ${prev.gold + goldReward}`);
        return {
          experience: prev.experience + xpReward,
          gold: prev.gold + goldReward,
        };
      });
      
      // Convert CombatEnemy to CurrentEnemy format for zone progression
      const zoneEnemy = {
        id: enemy.id,
        typeId: 'test_orc', // Default type for test enemies
        name: enemy.name,
        icon: '🧌', // Default icon for test enemies
        hp: 0, // Dead enemy
        maxHP: enemy.maxHealth,
        attack: enemy.stats.attack,
        xp: 20, // Base XP reward
        position: enemy.position
      };
      recordEnemyKill(zoneEnemy);
    }, 0); // 0ms delay to defer to next event loop
  }, [game.updateNinja, recordEnemyKill]);

  // Combat tick handler - MEMOIZED to prevent infinite re-renders
  const handleCombatTick = React.useCallback(() => {
    console.log('🔄 MOBILE DEBUG - handleCombatTick called, checking enemy deaths...');
    
    let enemiesToKill: CombatEnemy[] = []; // Track enemies to kill outside of setState
    
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

      // MOBILE FIX: Enemy AI - Track toward player for idle game combat engagement
      newState.enemies.forEach(enemy => {
        if (!enemy.isBoss) { // Only move regular enemies, not bosses
          // Mobile-optimized enemy movement - 2.5x faster and player-tracking  
          const MOVEMENT_SPEED = 0.75; // 2.5x faster (was 0.3)
          const SCREEN_WIDTH = 390;
          const GAME_AREA_HEIGHT = 704; // 844 - 140 (top bar + bottom nav)
          const ENEMY_SIZE = 35;
          
          // IDLE GAME AI: Move toward player for combat engagement
          const playerX = currentNinjaPosition.x;
          const playerY = currentNinjaPosition.y;
          
          // Calculate direction to player
          const deltaX = playerX - enemy.position.x;
          const deltaY = playerY - enemy.position.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Only move if not too close to player (maintain some distance for combat)
          if (distance > 40) {
            // Normalize direction toward player
            const normalizedX = deltaX / distance;
            const normalizedY = deltaY / distance;
            
            // Add slight randomness to movement to prevent perfect tracking
            const randomFactor = 0.2; // 20% randomness
            const finalX = normalizedX + (Math.random() - 0.5) * randomFactor;
            const finalY = normalizedY + (Math.random() - 0.5) * randomFactor;
            
            // Calculate new position
            let newX = enemy.position.x + (finalX * MOVEMENT_SPEED);
            let newY = enemy.position.y + (finalY * MOVEMENT_SPEED);
            
            // Keep within bounds
            newX = Math.max(0, Math.min(SCREEN_WIDTH - ENEMY_SIZE, newX));
            newY = Math.max(0, Math.min(GAME_AREA_HEIGHT - ENEMY_SIZE, newY));
            
            // Apply new position
            enemy.position.x = newX;
            enemy.position.y = newY;
          }
          // If too close to player, enemies stay put to allow combat
        }
      });

      // Auto-cast abilities - MOBILE FIX: Pause during manual joystick control to prevent stuttering
      if (!isManualControlActive) {
        for (let i = 0; i < 5; i++) {
          if (newState.abilityManager.isAbilityReady(i) && newState.enemies.length > 0) {
            if (newState.abilityManager.useAbility(i, newTick)) {
              castAbility(newState, i);
            }
          }
        }
      }

      // Identify dead enemies but DON'T handle kills inside setState
      const deadEnemies = newState.enemies.filter(enemy => enemy.health <= 0);
      enemiesToKill = [...deadEnemies]; // Store for processing outside setState
      
      // MOBILE DEBUG: Log enemy death processing
      if (deadEnemies.length > 0) {
        console.log(`💀 MOBILE DEBUG - Found ${deadEnemies.length} dead enemies:`, deadEnemies.map(e => `${e.id}(${e.health}hp)`));
      }
      
      // Check if any enemies are close to death for debugging
      const lowHealthEnemies = newState.enemies.filter(enemy => enemy.health <= 20 && enemy.health > 0);
      if (lowHealthEnemies.length > 0) {
        console.log(`🩸 MOBILE DEBUG - Low health enemies:`, lowHealthEnemies.map(e => `${e.id}(${e.health}/${e.maxHealth}hp)`));
      }
      
      // Remove dead enemies
      const beforeCount = newState.enemies.length;
      newState.enemies = newState.enemies.filter(enemy => enemy.health > 0);
      const afterCount = newState.enemies.length;
      
      if (beforeCount !== afterCount) {
        console.log(`🗑️ MOBILE DEBUG - Removed ${beforeCount - afterCount} dead enemies from state`);
      }

      // Maintain 10 enemies on screen with slower respawn to prevent chaos
      // BUT: Don't spawn new enemies if there's a boss present
      const MAX_ENEMIES = 10;
      const MIN_SPAWN_DELAY = 500; // Minimum 500ms between spawns
      const now = Date.now();
      const hasBoss = newState.enemies.some(enemy => enemy.isBoss);
      
      // Add respawn cooldown tracking
      if (!newState.lastSpawnTime) {
        newState.lastSpawnTime = now;
      }
      
      console.log(`🐛 Enemy spawn check: Current=${newState.enemies.length}, Max=${MAX_ENEMIES}, HasBoss=${hasBoss}`);
      
      // Only spawn normal enemies if no boss is present
      if (!hasBoss && newState.enemies.length < MAX_ENEMIES && (now - newState.lastSpawnTime) >= MIN_SPAWN_DELAY) {
        console.log(`🐛 Spawning enemy ${newState.enemies.length + 1}/${MAX_ENEMIES}`);
        spawnTestEnemy(newState);
        newState.lastSpawnTime = now;
      }

      return newState;
    });
    
    // HANDLE ENEMY KILLS OUTSIDE OF setCombatState TO AVOID CROSS-COMPONENT ISSUES
    console.log(`⚔️ MOBILE DEBUG - Processing ${enemiesToKill.length} enemy kills outside setState`);
    
    enemiesToKill.forEach((enemy, index) => {
      console.log(`💀 MOBILE DEBUG - Processing kill ${index + 1}/${enemiesToKill.length} for enemy ${enemy.id}`);
      handleEnemyKill(enemy);
    });
  }, [handleEnemyKill]); // Only depend on handleEnemyKill, not combatEngine

  // Find closest enemy to ninja - exposed for UI use
  const findClosestEnemyInternal = (enemies: CombatEnemy[]): CombatEnemy | null => {
    if (enemies.length === 0) return null;
    
    // Ninja position (center of screen)
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 140; // Smaller top bar + compact abilities bar
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

  // MOBILE FIX: Track ninja position from main game instead of managing separate state
  const [currentNinjaPosition, setCurrentNinjaPosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [isManualControlActive, setIsManualControlActive] = useState(false);
  
  // Update ninja position for combat calculations - now just tracks main game position
  const updateNinjaPosition = useCallback((newPosition: {x: number, y: number}) => {
    setCurrentNinjaPosition(newPosition);
  }, []);

  // MOBILE FIX: Pause/resume combat during manual joystick control to prevent stuttering
  const setManualControlActive = useCallback((active: boolean) => {
    setIsManualControlActive(active);
    console.log(`🎮 Manual control ${active ? 'ACTIVATED' : 'DEACTIVATED'} - Combat ${active ? 'PAUSED' : 'RESUMED'}`);
  }, []);

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
    createProjectile(target, damageResult.damage, currentNinjaPosition, {
      id: ability.id,
      name: ability.name,
      icon: ability.icon
    });

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
  const createProjectile = (targetEnemy: CombatEnemy, damage: number, ninjaPos?: {x: number, y: number}, abilityInfo?: {id: string, name: string, icon: string}) => {
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 140; // Smaller top bar + compact abilities bar
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
      // MOBILE ENHANCEMENT: Store ability information for visual representation
      abilityId: abilityInfo?.id || 'basic_shuriken',
      abilityName: abilityInfo?.name || 'Basic Shuriken',
      abilityIcon: abilityInfo?.icon || '🌟', // Default to star if no ability info
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
    const GAME_AREA_HEIGHT = 844 - 140; // Smaller top bar + compact abilities bar // Screen height minus bottom tabs
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
  const startCombat = React.useCallback(() => {
    console.log('🚀 Starting combat, adding tick callback...');
    setCombatState(prev => ({ ...prev, isInCombat: true }));
    
    // Add tick callback if not already added
    combatEngine.addTickCallback(handleCombatTick);
    console.log('🚀 Tick callback added, starting engine...');
    
    // Start the engine
    combatEngine.start();
  }, [combatEngine, handleCombatTick]);

  // Stop combat
  const stopCombat = React.useCallback(() => {
    setCombatState(prev => ({ ...prev, isInCombat: false }));
    combatEngine.removeTickCallback(handleCombatTick);
  }, [combatEngine, handleCombatTick]);

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
    
    const explosionTime = Date.now();
    setLastExplosionTime(explosionTime);
    
    setCombatState(prev => {
      // Calculate rewards for all current enemies
      const enemyCount = prev.enemies.length;
      const explosionXP = enemyCount * 20; // Base XP reward per enemy in explosion
      const explosionGold = enemyCount * 5; // 5 gold per enemy
      
      console.log(`💥 Explosion killing ${enemyCount} enemies, awarding ${explosionXP} XP and ${explosionGold} gold`);
      
      // Award XP using updateNinja if there are enemies to kill - MOBILE FIX: defer to prevent render-phase violation
      if (explosionXP > 0) {
        setTimeout(() => {
          game.updateNinja((ninja) => ({
            experience: ninja.experience + explosionXP,
            gold: ninja.gold + explosionGold,
          }));
        }, 0); // Defer to next event loop to prevent cross-context update during render
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
    const GAME_AREA_HEIGHT = 844 - 140; // Smaller top bar + compact abilities bar
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
    console.log(`🐉 Spawning boss: ${bossEnemy.name} - clearing all other enemies first`);
    setCombatState(prev => ({
      ...prev,
      enemies: [bossEnemy] // Replace all enemies with just the boss
    }));
  };

  // Clear specific enemy by ID
  const clearSpecificEnemy = (enemyId: string) => {
    setCombatState(prev => ({
      ...prev,
      enemies: prev.enemies.filter(enemy => enemy.id !== enemyId)
    }));
  };

  // MOBILE FIX: Manual ability casting for UI buttons - allows players to trigger abilities directly
  const useAbilityManually = useCallback((slotIndex: number): boolean => {
    console.log(`🎮 Manual cast attempt for slot ${slotIndex}`);
    
    // Check if ability is ready and cast it
    const isReady = combatState.abilityManager.isAbilityReady(slotIndex);
    if (!isReady) {
      console.log(`⏳ Ability in slot ${slotIndex} is not ready (still on cooldown)`);
      return false;
    }
    
    // Check if there are enemies to target
    if (combatState.enemies.length === 0) {
      console.log(`🎯 No enemies to target for manual ability cast`);
      return false;
    }
    
    // Use the ability through the ability manager
    const currentTick = combatEngine.getCurrentTick();
    const success = combatState.abilityManager.useAbility(slotIndex, currentTick);
    
    if (success) {
      // Cast the ability immediately using the same casting logic as auto-cast
      setCombatState(prev => {
        const newState = { ...prev };
        castAbility(newState, slotIndex);
        return newState;
      });
      
      console.log(`✨ Manual ability cast successful for slot ${slotIndex}`);
      return true;
    } else {
      console.log(`❌ Manual ability cast failed for slot ${slotIndex}`);
      return false;
    }
  }, [combatState.abilityManager, combatState.enemies]);
  useEffect(() => {
    combatEngine.start();
    
    // MOBILE FIX: Don't override default ability equipment - let AbilityManager constructor handle it
    // The AbilityManager already equips all 5 abilities by default in its constructor
    console.log('🎯 Combat engine started, using default ability equipment from AbilityManager');
    
    return () => {
      combatEngine.stop();
    };
  }, []);

  const contextValue: CombatContextType = React.useMemo(() => ({
    combatState,
    projectiles,
    startCombat,
    stopCombat,
    equipAbility,
    handleEnemyKill,
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
    setManualControlActive,
    lastExplosionTime,
    useAbilityManually, // MOBILE FIX: Add manual ability casting
  }), [
    // Only include primitive values and state to prevent infinite loop
    // Remove function dependencies that recreate and cause circular refs
    combatState,
    projectiles,
    lastExplosionTime,
    // MOBILE PERFORMANCE FIX: Add missing dependencies for proper state synchronization
    combatState.abilityManager,
    combatState.enemies,
    useAbilityManually, // Add the callback to dependencies
  ]);

  return (
    <CombatContext.Provider value={contextValue}>
      {children}
    </CombatContext.Provider>
  );
};