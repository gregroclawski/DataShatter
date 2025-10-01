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
  shadowClone?: {
    id: string;
    remainingTicks: number;
    position: { x: number; y: number };
    damageMultiplier: number; // 0.7 for 70% damage
  };
}

interface CombatEnemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  stats: CombatStats;
  position: { x: number; y: number };
  lastDamaged: number;
  lastAttackTick?: number; // Track when enemy last attacked player
  abilities?: string[]; // Boss abilities
  isBoss?: boolean; // Mark as boss for special behavior
  element?: 'fire' | 'ice' | 'shadow' | 'earth'; // Boss element
  movementDirection?: { x: number; y: number }; // For mobile enemy movement
  // Zone integration fields
  zoneTypeId?: string; // Zone enemy type ID for kill tracking
  zoneXP?: number; // XP reward from zone system
  markedForDeath?: boolean; // Prevent duplicate XP processing from AOE abilities
  isDying?: boolean; // Enemy is playing death animation
  deathStartTime?: number; // When death animation started
  xpAwarded?: boolean; // XP already awarded to prevent double-processing
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
  hasHit?: boolean; // Track if projectile has already hit to prevent duplicate damage
  isAOE?: boolean; // Mark as AOE projectile for special processing
  aoeRadius?: number; // AOE damage radius
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
  // triggerLevelUpExplosion: () => void; // REMOVED: Level up explosion disabled for performance
  findClosestEnemy: () => CombatEnemy | null; // Expose closest enemy finding
  updateNinjaPosition: (position: {x: number, y: number}) => void; // Update ninja position for projectiles
  lastExplosionTime: number;
  // Manual ability casting - MOBILE FIX
  useAbilityManually: (slotIndex: number) => boolean; // Manual ability activation for UI buttons
  // Manual control management
  setManualControlActive: (active: boolean) => void; // Pause/resume combat during manual joystick control
  // Save ability data
  saveAbilityData: () => void; // Save ability data to game context
  // Shadow Clone access
  shadowClone: CombatState['shadowClone']; // Expose shadow clone state for rendering
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
  const { currentZone, currentZoneLevel, recordEnemyKill, spawnZoneEnemy } = useZone();
  
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
  
  const [combatState, setCombatState] = useState<CombatState>(initialCombatState);
  
  // Watch for ability data to become available and restore abilities
  useEffect(() => {
    if (game.gameState.abilityData && combatState.abilityManager) {
      console.log('🔄 RESTORING ABILITY DATA FROM SAVE (DELAYED):', game.gameState.abilityData);
      combatState.abilityManager.restoreFromSaveData(game.gameState.abilityData);
      
      // Force re-render to update UI with restored abilities
      setCombatState(prev => ({ ...prev }));
    }
  }, [game.gameState.abilityData, combatState.abilityManager]);
  
  // Initialize player stats when game context changes
  useEffect(() => {
    if (game.gameState.ninja) {
      const effectiveStats = game.getEffectiveStats();
      
      setCombatState(prev => {
        // Only initialize if combat player stats are at defaults
        if (prev.playerStats.maxHealth === 100 && prev.playerStats.attack === 10) {
          console.log(`🔧 INITIALIZING PLAYER STATS: HP=${effectiveStats.health}, Attack=${effectiveStats.attack}, Defense=${effectiveStats.defense}`);
          
          return {
            ...prev,
            playerStats: {
              attack: effectiveStats.attack,
              defense: effectiveStats.defense,
              health: effectiveStats.health, // Start at full health
              maxHealth: effectiveStats.health,
              critChance: effectiveStats.critChance || 3,
              critDamage: effectiveStats.critDamage || 150,
              cooldownReduction: effectiveStats.cooldownReduction || 0,
            }
          };
        }
        return prev;
      });
    }
  }, [game.gameState.ninja]);
  
  const [projectiles, setProjectiles] = useState<CombatProjectile[]>([]);
  const [lastExplosionTime, setLastExplosionTime] = useState<number>(0);
  // MOBILE FIX: Removed duplicate ninja position state - using main game's position instead
  // Ninja position is now managed entirely by the main game component

  // Function to handle enemy kills - integrates with zone progression and awards XP/gold
  const handleEnemyKill = useCallback((enemy: CombatEnemy) => {
    // STREAMLINED XP CALCULATION - Single efficient computation
    const xpReward = (enemy.zoneXP || 5000) * (game.gameState.subscriptionBenefits?.xp_multiplier || 1.0);
    const goldReward = 10000 * (game.gameState.subscriptionBenefits?.drop_multiplier || 1.0);
    
    // INSTANT REWARD - Single update call
    game.updateNinja(prev => ({
      experience: prev.experience + xpReward,
      gold: prev.gold + goldReward,
    }));
    
    // ZONE PROGRESSION - Only if needed
    if (enemy.zoneTypeId) {
      recordEnemyKill({
        id: enemy.id,
        typeId: enemy.zoneTypeId,
        name: enemy.name,
        icon: '🧌',
        hp: 0,
        maxHP: enemy.maxHealth,
        attack: enemy.stats.attack,
        xp: enemy.zoneXP || 0,
        position: enemy.position
      });
    }
  }, [game.updateNinja, recordEnemyKill]);

  // Combat tick handler - MEMOIZED to prevent infinite re-renders
  const handleCombatTick = React.useCallback(() => {
    console.log('🔄 MOBILE DEBUG - handleCombatTick called, checking enemy deaths...');
    console.log(`🚨 COMBAT TICK DEBUG: isManualControlActive=${isManualControlActive}, isAlive=${game.gameState.isAlive}`);
    
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

      // Sync player stats from game state with EFFECTIVE stats (including upgrades)
      // CRITICAL: Do this BEFORE enemy attacks to avoid overriding combat damage
      if (newState.playerStats && game.gameState.ninja) {
        const effectiveStats = game.getEffectiveStats();
        
        // MOBILE FIX: Synchronize player stats with effective stats to reflect upgrades
        if (newState.playerStats.attack !== effectiveStats.attack ||
            newState.playerStats.defense !== effectiveStats.defense ||
            newState.playerStats.maxHealth !== effectiveStats.maxHealth) {
          
          console.log(`🔧 PLAYER STATS UPDATE: Attack ${newState.playerStats.attack} → ${effectiveStats.attack}, Defense ${newState.playerStats.defense} → ${effectiveStats.defense}, MaxHP ${newState.playerStats.maxHealth} → ${effectiveStats.maxHealth}`);
          
          // Handle max health changes carefully
          let newHealth = newState.playerStats.health;
          if (newState.playerStats.maxHealth !== effectiveStats.maxHealth) {
            // Only adjust health ratio if max health increased significantly (upgrades)
            if (effectiveStats.maxHealth > newState.playerStats.maxHealth * 1.1) {
              // Player got a health upgrade - maintain ratio but give the benefit
              const healthRatio = newState.playerStats.maxHealth > 0 ? 
                newState.playerStats.health / newState.playerStats.maxHealth : 1;
              newHealth = Math.floor(effectiveStats.maxHealth * healthRatio);
            } else if (newState.playerStats.health > effectiveStats.maxHealth) {
              // Max health decreased or current health exceeds new max - cap it
              newHealth = effectiveStats.maxHealth;
            }
            // Otherwise keep current health value (preserve combat damage)
          }
          
          newState.playerStats = {
            ...newState.playerStats,
            attack: effectiveStats.attack,
            defense: effectiveStats.defense,
            maxHealth: effectiveStats.maxHealth, // FIXED: Use maxHealth from effectiveStats
            health: newHealth, // Preserve combat damage
            critChance: effectiveStats.critChance || newState.playerStats.critChance,
            critDamage: effectiveStats.critDamage || newState.playerStats.critDamage,
            cooldownReduction: effectiveStats.cooldownReduction || newState.playerStats.cooldownReduction,
          };
        }

        // REVIVAL SYNC: Only sync when player is actually revived (game health equals max health and combat health is very low)
        if (game.gameState.isAlive && 
            game.gameState.ninja.health === effectiveStats.maxHealth && 
            newState.playerStats.health < effectiveStats.maxHealth * 0.1) {
          console.log(`💖 REVIVAL SYNC: Combat health ${newState.playerStats.health} → ${game.gameState.ninja.health} (Revival detected)`);
          newState.playerStats.health = game.gameState.ninja.health;
        }
      }

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
          
          // CRITICAL FIX: Enemy attacks when close to player
          const ATTACK_RANGE = 50; // Enemy attack range
          const ATTACK_COOLDOWN = 30; // Attack every 3 seconds (30 ticks at 10 TPS)
          
          if (distance <= ATTACK_RANGE) {
            // Enemy is close enough to attack player
            if (!enemy.lastAttackTick) enemy.lastAttackTick = 0;
            
            if (newState.currentTick - enemy.lastAttackTick >= ATTACK_COOLDOWN) {
              // Check if player is alive - CRITICAL: Don't attack dead players
              if (!game.gameState.isAlive) {
                console.log(`💀 DEAD PLAYER: ${enemy.name} cannot attack - player is dead!`);
                // Update enemy attack cooldown to prevent spam
                enemy.lastAttackTick = newState.currentTick;
              } else {
                // Check if player is invincible
                const isPlayerInvincible = game.gameState.isInvincible && 
                                         game.gameState.invincibilityEndTime && 
                                         Date.now() < game.gameState.invincibilityEndTime;
                
                if (isPlayerInvincible) {
                  console.log(`🛡️ INVINCIBLE: ${enemy.name} attack blocked! Player is invincible.`);
                  // Update enemy attack cooldown even if blocked
                  enemy.lastAttackTick = newState.currentTick;
                } else {
                // Enemy attacks player - FIXED: Scale damage appropriately for balanced gameplay
                const baseAttack = enemy.stats.attack / 100; // Scale down massive attack values
                const attackDamage = Math.floor(baseAttack * (0.8 + Math.random() * 0.4)); // 80-120% of scaled damage
                const playerDefense = newState.playerStats.defense;
                const finalDamage = Math.max(1, attackDamage - Math.floor(playerDefense * 0.1)); // Defense reduces 10% of damage
                
                console.log(`🗡️ ENEMY ATTACK: ${enemy.name} attacks player for ${finalDamage} damage (${attackDamage} base - ${Math.floor(playerDefense * 0.1)} defense reduction)`);
                
                // Apply damage to player
                const newPlayerHealth = Math.max(0, newState.playerStats.health - finalDamage);
                newState.playerStats.health = newPlayerHealth;
                
                console.log(`❤️ PLAYER HEALTH: ${newState.playerStats.health}/${newState.playerStats.maxHealth} (took ${finalDamage} damage)`);
                
                // Update enemy attack cooldown
                enemy.lastAttackTick = newState.currentTick;
                
                // Handle player death if health reaches 0
                if (newPlayerHealth <= 0) {
                  console.log('💀 PLAYER DEFEATED! Triggering revival system...');
                  // Set player as dead and trigger revival modal
                  setTimeout(() => {
                    // Set isAlive to false to trigger revival system
                    game.updateGameState({ isAlive: false });
                  }, 100);
                }
                }
              }
            }
          } else {
            // Move toward player if not in attack range
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
        }
      });

      // Shadow clone management
      if (newState.shadowClone) {
        // Update clone duration
        newState.shadowClone.remainingTicks--;
        
        // Make clone follow player (positioned slightly behind and to the right)
        const cloneOffset = 50; // Follow at 50 pixels offset
        newState.shadowClone.position.x = currentNinjaPosition.x + cloneOffset;
        newState.shadowClone.position.y = currentNinjaPosition.y + 10;
        
        // Remove clone when duration expires
        if (newState.shadowClone.remainingTicks <= 0) {
          console.log('👥 SHADOW CLONE: Duration expired, removing clone');
          newState.shadowClone = undefined;
        } else {
          // Clone attacks with player (70% damage)
          // Clone attacks every 2 seconds (20 ticks at 10 TPS)
          const CLONE_ATTACK_INTERVAL = 20;
          if (newState.currentTick % CLONE_ATTACK_INTERVAL === 0 && newState.enemies.length > 0) {
            console.log('👥 SHADOW CLONE: Casting duplicate attack at 70% damage');
            
            // Find closest enemy for clone attack
            const target = findClosestEnemyInternal(newState.enemies);
            if (target) {
              // Calculate clone damage (70% of player base attack)
              const cloneDamage = Math.floor(newState.playerStats.attack * 0.7);
              
              // Create clone projectile
              createProjectile(target, cloneDamage, newState.shadowClone.position, {
                id: 'shadow_clone_attack',
                name: 'Shadow Clone Attack',
                icon: '👥'
              });
            }
          }
        }
      }

      // Auto-cast abilities - MOBILE FIX: Pause during manual joystick control to prevent stuttering
      // CRITICAL: Don't cast abilities when player is dead
      console.log(`🚨 ABILITY CHECK: isManualControlActive=${isManualControlActive}, isAlive=${game.gameState.isAlive}`);
      if (!isManualControlActive && game.gameState.isAlive) {
        for (let i = 0; i < 5; i++) {
          if (newState.abilityManager.isAbilityReady(i) && newState.enemies.length > 0) {
            if (newState.abilityManager.useAbility(i, newTick)) {
              console.log(`🚨 ABILITY TRIGGERED: Auto-cast from slot ${i}`);
              castAbility(newState, i);
            }
          }
        }
      }

      // Process dying enemies for XP awarding + death animation cleanup
      const dyingEnemies = newState.enemies.filter(enemy => enemy.isDying && enemy.health <= 0);
      const deadEnemies = newState.enemies.filter(enemy => enemy.health <= 0 && !enemy.isDying);
      
      // Process ALL dead and dying enemies for XP (with 20 TPS = 50ms response time)
      enemiesToKill = [...deadEnemies, ...dyingEnemies]; // Process all killed enemies for XP
      
      // Remove enemies that have finished their death animation (750ms)
      const currentTime = Date.now();
      newState.enemies = newState.enemies.filter(enemy => {
        if (enemy.isDying && enemy.deathStartTime) {
          const animationDuration = 750; // 750ms death fade
          const isAnimationComplete = currentTime - enemy.deathStartTime >= animationDuration;
          if (isAnimationComplete) {
            console.log(`💀 DEATH ANIMATION COMPLETE: ${enemy.name} removed after ${currentTime - enemy.deathStartTime}ms fade`);
            return false; // Remove from array
          }
        }
        return true; // Keep in array
      });
      
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

      // Maintain 20 enemies on screen with faster respawn for more intense combat
      // BUT: Don't spawn new enemies if there's a boss present
      const MAX_ENEMIES = 20; // DOUBLED from 10 to 20 for more intense combat
      const MIN_SPAWN_DELAY = 250; // HALVED from 500ms to 250ms for 2x faster spawning
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
    
    // BULK XP PROCESSING - Single update for all kills
    if (enemiesToKill.length > 0) {
      // Calculate total rewards in one pass
      let totalXP = 0;
      let totalGold = 0;
      const zoneKills: any[] = [];
      
      const xpMultiplier = game.gameState.subscriptionBenefits?.xp_multiplier || 1.0;
      const goldMultiplier = game.gameState.subscriptionBenefits?.drop_multiplier || 1.0;
      
      enemiesToKill.forEach(enemy => {
        totalXP += (enemy.zoneXP || 5000) * xpMultiplier;
        totalGold += 10000 * goldMultiplier;
        
        if (enemy.zoneTypeId) {
          zoneKills.push({
            id: enemy.id,
            typeId: enemy.zoneTypeId,
            name: enemy.name,
            icon: '🧌',
            hp: 0,
            maxHP: enemy.maxHealth,
            attack: enemy.stats.attack,
            xp: enemy.zoneXP || 0,
            position: enemy.position
          });
        }
      });
      
      // Single batch update for all kills
      game.updateNinja(prev => ({
        experience: prev.experience + totalXP,
        gold: prev.gold + totalGold,
      }));
      
      // Batch zone progression
      zoneKills.forEach(zoneEnemy => recordEnemyKill(zoneEnemy));
    }
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

    console.log(`🚨 ABILITY TRIGGERED: ${ability.id} from slot ${slotIndex}`);

    // Calculate base damage
    let damage = ability.stats.baseDamage;
    
    // Apply synergy bonuses
    deck.activeSynergies.forEach(synergy => {
      if (synergy.bonus.damageBonus && 
          synergy.requiredTags.some(tag => ability.tags.includes(tag))) {
        damage *= (1 + synergy.bonus.damageBonus / 100);
      }
    });

    // Check if this is an AOE ability
    const isAOE = ability.effects.includes('AoE') && ability.stats.aoeRadius;
    console.log(`🔍 ABILITY CHECK: ${ability.name} - effects: ${JSON.stringify(ability.effects)}, aoeRadius: ${ability.stats.aoeRadius}, isAOE: ${isAOE}`);
    
    if (isAOE) {
      console.log(`💥 AOE ABILITY: ${ability.name} with radius ${ability.stats.aoeRadius}`);
      
      // TEMPORARY FIX: For now, let's use the old system but fix the XP issue
      // Find all enemies within AOE range of ninja
      const ninjaX = currentNinjaPosition.x + 20; // Center of ninja
      const ninjaY = currentNinjaPosition.y + 20;
      const aoeRadius = ability.stats.aoeRadius;
      
      const enemiesInRange = state.enemies.filter(enemy => {
        const enemyX = enemy.position.x + 17.5; // Center of enemy
        const enemyY = enemy.position.y + 17.5;
        const distance = Math.sqrt(Math.pow(enemyX - ninjaX, 2) + Math.pow(enemyY - ninjaY, 2));
        return distance <= aoeRadius;
      });
      
      console.log(`💥 AOE TARGETS: Found ${enemiesInRange.length} enemies in range (${aoeRadius} radius)`);
      
      // Create projectile for each enemy in range - FIXED XP VERSION
      enemiesInRange.forEach(enemy => {
        const damageResult = DamageCalculator.calculateDamage(damage, state.playerStats, enemy.stats);
        createProjectile(enemy, damageResult.damage, currentNinjaPosition, {
          id: ability.id,
          name: ability.name,
          icon: ability.icon
        });
        console.log(`💥 AOE HIT: ${enemy.name} for ${damageResult.damage} damage`);
        
        // Add AOE kill tracking
        if (damageResult.damage >= enemy.health) {
          console.log(`🔍 XP DEBUG: AOE projectile should kill ${enemy.name} (damage: ${damageResult.damage} >= health: ${enemy.health})`);
        }
      });
      
      console.log(`🎯 ${ability.name} AOE cast! Hit ${enemiesInRange.length} enemies for ${damage} base damage each`);
      
    } else {
      // Single target ability (original logic)
      const target = findClosestEnemyInternal(state.enemies);
      if (!target) return;

      const damageResult = DamageCalculator.calculateDamage(damage, state.playerStats, target.stats);

      // Create projectile for visual effect and delayed damage
      console.log(`🔍 SINGLE TARGET DEBUG: Creating projectile for ${target.name} with ${damageResult.damage} damage`);
      createProjectile(target, damageResult.damage, currentNinjaPosition, {
        id: ability.id,
        name: ability.name,
        icon: ability.icon
      });

      console.log(`🎯 ${ability.name} cast! Single target for ${damageResult.damage} damage${damageResult.isCritical ? ' (CRIT!)' : ''}`);
      
      // Add kill prediction for single target
      if (damageResult.damage >= target.health) {
        console.log(`🔍 XP DEBUG: Single target projectile should kill ${target.name} (damage: ${damageResult.damage} >= health: ${target.health})`);
      }
    }

    // Apply DoT effects (for primary target in single target, or all targets in AOE)
    if (ability.effects.includes('DoT') && ability.stats.duration) {
      const targets = isAOE ? 
        state.enemies.filter(enemy => {
          const ninjaX = currentNinjaPosition.x + 20;
          const ninjaY = currentNinjaPosition.y + 20;
          const enemyX = enemy.position.x + 17.5;
          const enemyY = enemy.position.y + 17.5;
          const distance = Math.sqrt(Math.pow(enemyX - ninjaX, 2) + Math.pow(enemyY - ninjaY, 2));
          return distance <= ability.stats.aoeRadius;
        }) : 
        [findClosestEnemyInternal(state.enemies)].filter(Boolean);

      targets.forEach(target => {
        state.statusEffects.addEffect(target.id, {
          id: `${ability.id}_dot`,
          type: 'dot',
          remainingTicks: Math.floor(ability.stats.duration * 10),
          tickInterval: 10,
          lastTick: state.currentTick,
          value: Math.floor(damage * 0.3),
          stackable: false,
        });
      });
    }

    // Apply Buff effects (Shadow Clone)
    if (ability.effects.includes('Buff') && ability.id === 'shadow_clone') {
      console.log(`👥 SHADOW CLONE: Creating shadow clone for ${ability.stats.duration} seconds`);
      
      // Position clone slightly offset from ninja
      const cloneX = currentNinjaPosition.x + 60; // 60 pixels to the right
      const cloneY = currentNinjaPosition.y + 10; // 10 pixels down
      
      state.shadowClone = {
        id: `shadow_clone_${Date.now()}`,
        remainingTicks: Math.floor(ability.stats.duration * 10), // Convert seconds to ticks (30s = 300 ticks)
        position: { x: cloneX, y: cloneY },
        damageMultiplier: 0.7, // 70% damage
      };
      
      console.log(`👥 SHADOW CLONE ACTIVE: Clone will last ${ability.stats.duration}s and deal 70% damage`);
    }
  };

  // Create projectile that will deal damage when it hits
  const createProjectile = (targetEnemy: CombatEnemy, damage: number, ninjaPos?: {x: number, y: number}, abilityInfo?: {id: string, name: string, icon: string}, isAOE?: boolean, aoeRadius?: number) => {
    if (!targetEnemy) {
      console.log('❌ Cannot create projectile: No target enemy');
      return null;
    }
    
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 140; // Smaller top bar + compact abilities bar
    const NINJA_SIZE = 40;
    
    // Use provided ninja position or default to center
    const ninjaX = ninjaPos ? ninjaPos.x + NINJA_SIZE / 2 : SCREEN_WIDTH / 2;
    const ninjaY = ninjaPos ? ninjaPos.y + NINJA_SIZE / 2 : GAME_AREA_HEIGHT / 2;
    const ENEMY_SIZE = 35;
    
    const projectileId = `proj_${Date.now()}_${Math.random()}`;
    
    const projectile: CombatProjectile = {
      id: projectileId,
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
      // AOE properties
      isAOE: isAOE || false,
      aoeRadius: aoeRadius || 0,
    };
    
    console.log(`🚀 PROJECTILE CREATED: ${abilityInfo?.name || 'Basic Shuriken'} projectile (ID: ${projectileId}) targeting ${targetEnemy.name} for ${damage} damage`);
    console.log(`🎯 PROJECTILE DEBUG: isAOE=${isAOE}, aoeRadius=${aoeRadius}, damage=${damage}`);
    
    console.log(`🔥 Creating projectile to enemy ${targetEnemy.id} for ${damage} damage`);
    console.log(`🎯 Projectile origin: ninja at (${ninjaX}, ${ninjaY}), target at (${projectile.targetX}, ${projectile.targetY})`);
    
    setProjectiles(prev => [...prev, projectile]);
    
    // Schedule projectile hit
    setTimeout(() => {
      handleProjectileHit(projectile);
    }, 500);
    
    return projectile;
  };

  // Spawn a zone-based enemy using the selected zone
  const spawnTestEnemy = (state: CombatState) => {
    console.log(`🎯 SPAWNING ENEMY: Attempting to spawn enemy from selected zone`);
    
    // Get zone enemy from ZoneContext
    const zoneEnemy = spawnZoneEnemy();
    if (!zoneEnemy) {
      console.log(`❌ No zone enemy available - falling back to test enemy`);
      // Fallback to basic test enemy if zone system fails
      spawnBasicTestEnemy(state);
      return;
    }
    
    console.log(`🎯 ZONE ENEMY SPAWNED: ${zoneEnemy.name} (${zoneEnemy.typeId}) from Zone ${currentZone?.id} Level ${currentZoneLevel?.level}`);
    
    // Convert zone enemy to combat enemy format
    const combatEnemy: CombatEnemy = {
      id: zoneEnemy.id,
      name: zoneEnemy.name,
      health: zoneEnemy.hp,
      maxHealth: zoneEnemy.maxHP,
      stats: {
        attack: zoneEnemy.attack,
        defense: 10, // Default defense
        health: zoneEnemy.hp,
        maxHealth: zoneEnemy.maxHP,
        critChance: 5,
        critDamage: 120,
        cooldownReduction: 0,
      },
      position: zoneEnemy.position,
      lastDamaged: 0,
      // Store zone info for kill tracking
      zoneTypeId: zoneEnemy.typeId,
      zoneXP: zoneEnemy.xp,
    };
    
    console.log(`🐛 Added zone enemy: ${combatEnemy.name} with ${combatEnemy.health} HP at Zone ${currentZone?.id} Level ${currentZoneLevel?.level}`);
    state.enemies.push(combatEnemy);
  };
  
  // Fallback basic enemy spawner
  const spawnBasicTestEnemy = (state: CombatState) => {
    const SCREEN_WIDTH = 390;
    const GAME_AREA_HEIGHT = 844 - 140;
    const ENEMY_SIZE = 35;
    
    const x = Math.random() * (SCREEN_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE;
    const y = Math.random() * (GAME_AREA_HEIGHT - ENEMY_SIZE * 2) + ENEMY_SIZE;
    
    const enemy: CombatEnemy = {
      id: `fallback_enemy_${Date.now()}_${Math.random()}`,
      name: `Test Orc ${Math.floor(Math.random() * 100)}`,
      health: 50,
      maxHealth: 50,
      stats: {
        attack: 15,
        defense: 10,
        health: 50,
        maxHealth: 50,
        critChance: 5,
        critDamage: 120,
        cooldownReduction: 0,
      },
      position: { x, y },
      lastDamaged: 0,
    };
    
    console.log(`🐛 Fallback: Spawned ${enemy.name} at (${Math.round(x)}, ${Math.round(y)})`);
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

  // REMOVED: Level up explosion disabled for performance with ultra-fast XP system
  // const triggerLevelUpExplosion = () => { ... }

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
    console.log(`🔥🔥🔥 MANUAL ABILITY BUTTON TAPPED - SLOT ${slotIndex} 🔥🔥🔥`);
    console.log(`🚨 ABILITY TRIGGERED: Manual cast from slot ${slotIndex}`);
    console.log(`🎮 Manual cast attempt for slot ${slotIndex}`);
    
    // CRITICAL: Check if player is alive first
    if (!game.gameState.isAlive) {
      console.log(`💀 Manual ability cast blocked - player is dead!`);
      return false;
    }
    
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

  // CRITICAL FIX: Handle projectile impacts separately from animation loop
  useEffect(() => {
    const processProjectileImpacts = () => {
      setProjectiles(currentProjectiles => {
        return currentProjectiles.map(projectile => {
          if (!projectile) return null;

          // Calculate progress
          const currentTime = Date.now();
          const startTime = projectile.startTime || currentTime;
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / (projectile.duration || 500), 1);

          // Apply damage when projectile completes
          if (progress >= 1 && !projectile.hasHit) {
            projectile.hasHit = true;
            
            console.log(`🎯 PROJECTILE IMPACT: ${projectile.abilityName} projectile hit target`);
            setCombatState(prev => {
              const newState = { ...prev };
              
              if (projectile.isAOE && projectile.aoeRadius && projectile.aoeRadius > 0) {
                // AOE PROJECTILE: Damage all enemies within radius of impact point
                console.log(`💥 AOE PROJECTILE IMPACT: ${projectile.abilityName} with radius ${projectile.aoeRadius}`);
                
                const impactX = projectile.targetX;
                const impactY = projectile.targetY;
                const enemiesKilled: CombatEnemy[] = [];
                
                // Find all enemies within AOE radius of impact
                newState.enemies = newState.enemies.map(enemy => {
                  if (enemy.health <= 0 || enemy.markedForDeath) return enemy;
                  
                  const enemyX = enemy.position.x + 17.5; // Center of enemy
                  const enemyY = enemy.position.y + 17.5;
                  const distance = Math.sqrt(Math.pow(enemyX - impactX, 2) + Math.pow(enemyY - impactY, 2));
                  
                  console.log(`🎯 AOE DISTANCE CHECK: ${enemy.name} at (${enemyX}, ${enemyY}) vs impact (${impactX}, ${impactY}) = ${distance.toFixed(1)}px (radius: ${projectile.aoeRadius}px)`);
                  
                  if (distance <= projectile.aoeRadius) {
                    // Use the projectile's pre-calculated damage (already includes all modifiers)
                    const newHealth = Math.max(0, enemy.health - projectile.damage);
                    
                    console.log(`💥 AOE DAMAGE: ${enemy.name} hit for ${projectile.damage} damage (${enemy.health} -> ${newHealth})`);
                    
                    // Check if enemy dies from AOE damage
                    if (newHealth <= 0 && enemy.health > 0) {
                      console.log(`💀 AOE KILL: ${enemy.name} killed by ${projectile.abilityName}!`);
                      enemiesKilled.push(enemy); // Store original enemy for XP awarding
                      
                      return {
                        ...enemy,
                        health: 0,
                        markedForDeath: true,
                        lastDamaged: combatEngine.getCurrentTick()
                      };
                    } else {
                      return {
                        ...enemy,
                        health: newHealth,
                        lastDamaged: combatEngine.getCurrentTick()
                      };
                    }
                  }
                  
                  return enemy; // Enemy outside AOE radius - no damage
                });
                
                // Award XP for all killed enemies
                if (enemiesKilled.length > 0) {
                  console.log(`🎯 AOE XP AWARD: ${enemiesKilled.length} enemies killed by ${projectile.abilityName}`);
                  setTimeout(() => {
                    enemiesKilled.forEach(enemy => handleEnemyKill(enemy));
                  }, 0);
                }
                
              } else {
                // SINGLE TARGET PROJECTILE: Original logic
                const enemyIndex = newState.enemies.findIndex(e => e.id === projectile.targetEnemyId);
                
                if (enemyIndex >= 0 && newState.enemies[enemyIndex].health > 0 && !newState.enemies[enemyIndex].markedForDeath) {
                  newState.enemies = [...newState.enemies];
                  const enemy = newState.enemies[enemyIndex];
                  const newHealth = Math.max(0, enemy.health - projectile.damage);
                  
                  newState.enemies[enemyIndex] = {
                    ...enemy,
                    health: newHealth,
                    lastDamaged: combatEngine.getCurrentTick()
                  };
                  
                  console.log(`🎯 SINGLE TARGET DAMAGE: ${enemy.name} health: ${newHealth}/${enemy.maxHealth}`);
                  
                  // FAST XP SYSTEM: Mark enemies for ultra-fast batch processing
                  if (newHealth <= 0 && enemy.health > 0) {
                    console.log(`💀 FAST XP KILL: ${enemy.name} killed by ${projectile.abilityName}! Marked for immediate batch XP...`);
                    
                    // Mark enemy as killed - batch system will process XP within 16ms
                    newState.enemies[enemyIndex] = {
                      ...newState.enemies[enemyIndex],
                      health: 0,
                      isDying: true,
                      deathStartTime: Date.now()
                    };
                  } else if (enemy.health > 0) {
                    console.log(`🎯 DAMAGE: ${enemy.name} hit for ${projectile.damage} damage (${enemy.health} → ${newHealth})`);
                  }
                }
              }
              
              return newState;
            });
          }

          // Clean up completed projectiles
          if (progress >= 1.5) {
            return null;
          }

          return projectile;
        }).filter(Boolean);
      });
    };

    // Process impacts independently from visual animation at 30fps
    const impactInterval = setInterval(processProjectileImpacts, 33);
    return () => clearInterval(impactInterval);
  }, [handleEnemyKill]);

  // Manual save ability data function - called when abilities are modified
  const saveAbilityData = useCallback(() => {
    if (combatState.abilityManager) {
      const abilityData = combatState.abilityManager.getSaveData();
      console.log('💾 MANUALLY SAVING ABILITY DATA TO GAME CONTEXT:', abilityData);
      game.updateAbilityData(abilityData);
    }
  }, [combatState.abilityManager, game.updateAbilityData]);

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
    // triggerLevelUpExplosion, // REMOVED: Level up explosion disabled for performance
    findClosestEnemy,
    updateNinjaPosition,
    setManualControlActive,
    lastExplosionTime,
    useAbilityManually, // MOBILE FIX: Add manual ability casting
    saveAbilityData, // Expose save function to UI components
    shadowClone: combatState.shadowClone, // Expose shadow clone state for rendering
  }), [
    // Only include primitive values and state to prevent infinite loop
    // Remove function dependencies that recreate and cause circular refs
    combatState,
    projectiles,
    lastExplosionTime,
    // MOBILE PERFORMANCE FIX: Add missing dependencies for proper state synchronization
    combatState.abilityManager,
    combatState.enemies,
    combatState.shadowClone, // Add shadow clone state to dependencies
    useAbilityManually, // Add the callback to dependencies
    saveAbilityData, // Add saveAbilityData to dependencies
  ]);

  return (
    <CombatContext.Provider value={contextValue}>
      {children}
    </CombatContext.Provider>
  );
};