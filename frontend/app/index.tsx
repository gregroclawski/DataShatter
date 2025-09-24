import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';
import { useZone } from '../src/contexts/ZoneContext';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import SkillsOverlay from '../src/components/SkillsOverlay';
import StoreOverlay from '../src/components/StoreOverlay';
import { EnemiesZonesOverlay } from '../src/components/EnemiesZonesOverlay';
import { EquipmentOverlay } from '../src/components/EquipmentOverlay';
import { BossOverlay } from '../src/components/BossOverlay';
import CombatUI from '../src/components/CombatUI';
import AbilityDeckOverlay from '../src/components/AbilityDeckOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 250; // Leave space for bottom tabs
const NINJA_SIZE = 40;
const ENEMY_SIZE = 35;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'zones' | 'equipment' | null;

export default function NinjaIdleGame() {
  const { gameState, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat, triggerLevelUpExplosion, projectiles, updateNinjaPosition } = useCombat();
  const { currentZone, currentZoneLevel, getZoneProgress, recordEnemyKill } = useZone();
  
  const ninja = gameState?.ninja;
  
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [lastExplosionTime, setLastExplosionTime] = useState(0);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);
  const [totalKills, setTotalKills] = useState(0);
  const [lastProcessedKill, setLastProcessedKill] = useState(0);
  
  // Auto-movement system for ninja - start in bottom left corner so ninja has to move
  const [ninjaPosition, setNinjaPosition] = useState({
    x: 50, // Start in bottom left corner
    y: GAME_AREA_HEIGHT - NINJA_SIZE - 50
  });
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
  const [isAttacking, setIsAttacking] = useState(false);
  const [lastAttackTime, setLastAttackTime] = useState(0);

  const insets = useSafeAreaInsets();

  // Level-up explosion attack - delegate to combat context with cooldown
  const handleLevelUpExplosion = useCallback(() => {
    const now = Date.now();
    const EXPLOSION_COOLDOWN = 5000; // 5 seconds cooldown
    
    // Check if explosion is on cooldown
    if (now - lastExplosionTime < EXPLOSION_COOLDOWN) {
      console.log('💥 LEVEL UP EXPLOSION on cooldown, skipping...');
      return;
    }
    
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    setLastExplosionTime(now);
    
    // Delegate to combat context where we know the context works
    triggerLevelUpExplosion();
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, [triggerLevelUpExplosion, lastExplosionTime]);

  // Watch for level changes to trigger explosion
  useEffect(() => {
    if (ninja && ninja.level > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', ninja.level);
      handleLevelUpExplosion();
      setPreviousLevel(ninja.level);
    }
  }, [ninja?.level, previousLevel, handleLevelUpExplosion]);

  // XP is now handled directly by CombatContext (10 XP per kill)
  // Removed duplicate XP system to prevent double rewards

  // Enhanced AI movement system with proper speed and tracking
  useEffect(() => {
    const moveNinja = () => {
      const now = Date.now();
      const deltaTime = now - lastMovementTime;
      
      if (deltaTime >= 16) { // 60 FPS for smooth movement
        setNinjaPosition(prevPos => {
          // Check if we have enemies to target and ninja is not attacking
          if (!combatState.enemies || combatState.enemies.length === 0 || isAttacking) {
            return prevPos; // Don't move if no enemies or currently attacking
          }
          
          // Find closest enemy
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          combatState.enemies.forEach(enemy => {
            const distance = Math.sqrt(
              Math.pow(enemy.position.x - (prevPos.x + NINJA_SIZE / 2), 2) + 
              Math.pow(enemy.position.y - (prevPos.y + NINJA_SIZE / 2), 2)
            );
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestEnemy = enemy;
            }
          });
          
          if (!closestEnemy) return prevPos;
          
          // Check if we're in attack range (stop moving when close enough)
          const ATTACK_RANGE = 40; // Reduced attack range so ninja moves closer to enemies
          if (closestDistance <= ATTACK_RANGE) {
            console.log(`🎯 Ninja in attack range (${closestDistance.toFixed(0)}px) - stopping movement`);
            return prevPos; // Stop moving when in attack range
          }
          
          // Calculate direction toward closest enemy
          const targetX = closestEnemy.position.x + ENEMY_SIZE / 2 - NINJA_SIZE / 2;
          const targetY = closestEnemy.position.y + ENEMY_SIZE / 2 - NINJA_SIZE / 2;
          
          const dirX = targetX - prevPos.x;
          const dirY = targetY - prevPos.y;
          const distance = Math.sqrt(dirX * dirX + dirY * dirY);
          
          if (distance === 0) return prevPos;
          
          // Normalize direction and apply speed
          const normalizedDirX = dirX / distance;
          const normalizedDirY = dirY / distance;
          
          // Proper speed in pixels per second (converted to pixels per frame)
          const MOVEMENT_SPEED = 50; // 50 pixels per second
          const speedPerFrame = (MOVEMENT_SPEED / 1000) * deltaTime;
          
          // Don't overshoot the target
          const actualDistance = Math.min(speedPerFrame, distance);
          
          let newX = prevPos.x + normalizedDirX * actualDistance;
          let newY = prevPos.y + normalizedDirY * actualDistance;
          
          // Keep ninja within bounds
          const maxX = SCREEN_WIDTH - NINJA_SIZE;
          const maxY = GAME_AREA_HEIGHT - NINJA_SIZE;
          
          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));
          
          // Only log significant movements to avoid spam
          const moveDistance = Math.sqrt(Math.pow(newX - prevPos.x, 2) + Math.pow(newY - prevPos.y, 2));
          if (moveDistance > 1) {
            console.log(`🏃 Ninja moving toward enemy (speed: ${speedPerFrame.toFixed(1)}px/frame, distance: ${closestDistance.toFixed(0)}, pos: (${newX.toFixed(0)}, ${newY.toFixed(0)}))`);
          }
          
          return { x: newX, y: newY };
        });
        
        setLastMovementTime(now);
      }
    };

    const movementInterval = setInterval(moveNinja, 16); // 60 FPS for smooth movement
    return () => clearInterval(movementInterval);
  }, [lastMovementTime, combatState.enemies, isAttacking]);

  // Listen for combat logs and count kills

  // Listen for combat logs and count kills + detect attacks + record zone progress
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog(...args);
      
      const message = args.join(' ');
      
      // Check for enemy kill messages
      if (message.includes('Enemy killed! Max HP:')) {
        setTotalKills(prev => {
          const newTotal = prev + 1;
          console.log(`🎯 Kill count updated: ${newTotal}`);
          
          // Record kill for zone progression
          if (recordEnemyKill) {
            const zoneEnemy = {
              id: `enemy_${Date.now()}`,
              typeId: 'test_enemy',
              name: 'Test Enemy',
              icon: '👹',
              hp: 0,
              maxHP: 100,
              attack: 10,
              xp: 10,
              position: { x: 100, y: 100 }
            };
            
            recordEnemyKill(zoneEnemy);
            console.log(`🗺️ Zone kill recorded!`);
          }
          
          return newTotal;
        });
      }
      
      // Detect when ninja is attacking (ability cast or projectile creation)
      if (message.includes('cast!') || message.includes('Creating projectile')) {
        setIsAttacking(true);
        setLastAttackTime(Date.now());
        console.log('⚔️ Ninja is attacking - stopping movement');
        
        // Update ninja position in combat context RIGHT BEFORE projectile creation
        updateNinjaPosition({ x: ninjaPosition.x, y: ninjaPosition.y });
        console.log(`🎯 Updated combat ninja position for attack: (${ninjaPosition.x.toFixed(0)}, ${ninjaPosition.y.toFixed(0)})`);
        
        // Stop attacking after a short duration
        setTimeout(() => {
          setIsAttacking(false);
          console.log('🏃 Attack finished - resuming movement');
        }, 1000); // Stop moving for 1 second during attack
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, [recordEnemyKill]);

  // Start combat when component mounts
  useEffect(() => {
    console.log('🎮 Main component calling startCombat...');
    startCombat();
    return () => stopCombat();
  }, []);

  const handleAbilityPress = (slotIndex: number) => {
    setShowAbilityDeck(true);
  };

  const bottomTabs = [
    { id: 'stats', name: 'Stats', icon: 'person' },
    { id: 'abilities', name: 'Abilities', icon: 'flash' },
    { id: 'pets', name: 'Pets', icon: 'heart' },
    { id: 'skills', name: 'Skills', icon: 'barbell' },
    { id: 'store', name: 'Store', icon: 'storefront' },
    { id: 'zones', name: 'Zones', icon: 'map' },
    { id: 'equipment', name: 'Equipment', icon: 'shield' },
  ];

  // Show loading if ninja data isn't available
  if (!ninja) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading Game Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top UI Bar */}
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.levelText}>Level {ninja.level}</Text>
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <View 
                style={[
                  styles.xpBar, 
                  { width: `${(ninja.experience / ninja.experienceToNext) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>{ninja.experience}/{ninja.experienceToNext} XP</Text>
          </View>
        </View>
        
        <View style={styles.resources}>
          <View style={styles.resourceItem}>
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text style={styles.resourceText}>{ninja.health}/{ninja.maxHealth}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
            <Text style={styles.resourceText}>{ninja.gold}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="diamond" size={16} color="#3b82f6" />
            <Text style={styles.resourceText}>{ninja.gems}</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Combat Status */}
        <View style={styles.combatStatus}>
          <Text style={styles.stageText}>
            Enemies: {combatState.enemies.length}
          </Text>
          
          {/* Current Zone Display */}
          {currentZone && currentZoneLevel && (
            <Text style={[styles.combatText, { color: '#8b5cf6', fontSize: 12 }]}>
              Zone: {currentZone.name} (Lv.{currentZoneLevel.level}) • {getZoneProgress(currentZone.id)?.killsInLevel || 0}/1000 kills
            </Text>
          )}
          
          <Text style={[styles.combatText, { 
            color: combatState.isInCombat ? '#10b981' : '#ef4444' 
          }]}>
            {combatState.isInCombat ? 'In Combat' : 'Paused'}
          </Text>
        </View>

        {/* Battle Arena */}
        <View style={styles.battleArena}>
          {/* Ninja Character - Auto-movement system */}
          <View
            style={[
              styles.ninja,
              {
                left: ninjaPosition.x,
                top: ninjaPosition.y,
              },
              isLevelingUp && styles.ninjaLevelingUp,
            ]}
          >
            <Ionicons name="person" size={30} color="#8b5cf6" />
            {isLevelingUp && (
              <View style={styles.explosionEffect}>
                <Ionicons name="flash" size={60} color="#fbbf24" />
              </View>
            )}
          </View>

          {/* Enemies from Combat System */}
          {(() => { console.log(`🔍 Combat state has ${combatState.enemies?.length || 0} enemies`); return null; })()}
          {combatState.enemies && combatState.enemies.length > 0 ? (
            combatState.enemies.map((enemy, index) => {
              console.log(`👹 Rendering enemy ${index + 1}: pos(${enemy.position.x}, ${enemy.position.y}) health:${enemy.health}`);
              return (
                <View
                  key={enemy.id}
                  style={[
                    styles.enemy,
                    {
                      left: enemy.position.x,
                      top: enemy.position.y,
                    },
                  ]}
                >
                  <Ionicons name="skull" size={30} color="#ef4444" />
                  
                  {/* Enemy Health Bar */}
                  <View style={styles.enemyHealthBarContainer}>
                    <View style={styles.enemyHealthBarBackground}>
                      <View 
                        style={[
                          styles.enemyHealthBar, 
                          { width: `${(enemy.health / enemy.maxHealth) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : null}

          {/* Projectiles from Combat System */}
          {console.log(`🔥 Combat Projectiles array length: ${projectiles.length}`) || null}
          {projectiles.map((projectile) => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - projectile.startTime) / projectile.duration, 1);
            
            // Calculate current position using linear interpolation
            const currentX = projectile.x + (projectile.targetX - projectile.x) * progress;
            const currentY = projectile.y + (projectile.targetY - projectile.y) * progress;
            
            return (
              <View
                key={projectile.id}
                style={[
                  styles.projectile,
                  {
                    left: currentX - 6, // Center the projectile
                    top: currentY - 6,
                    opacity: 1 - progress * 0.2, // Fade slightly as it travels
                  }
                ]}
              >
                <Ionicons name="diamond" size={12} color="#8b5cf6" />
                <Text style={styles.projectileDamage}>{projectile.damage}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Combat UI - New ability system */}
      <CombatUI onAbilityPress={handleAbilityPress} />

      {/* Bottom Navigation */}
      <View style={styles.bottomTabs}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => {
              console.log(`Tapped ${tab.name} tab`);
              if (tab.id === 'abilities') {
                // Dock-style behavior for abilities tab too
                if (showAbilityDeck) {
                  setShowAbilityDeck(false); // Close if already open
                } else {
                  setShowAbilityDeck(true); // Open if closed
                }
              } else {
                // Dock-style behavior: tap to open, tap again to close
                if (activeOverlay === tab.id) {
                  setActiveOverlay(null); // Close if already open
                } else {
                  setActiveOverlay(tab.id as ActiveOverlay); // Open if closed
                }
              }
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeOverlay === tab.id ? '#8b5cf6' : '#9ca3af'} 
            />
            <Text style={[
              styles.tabText,
              { color: activeOverlay === tab.id ? '#8b5cf6' : '#9ca3af' }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlays - positioned absolutely within main container, NO Modal */}
      {activeOverlay === 'stats' && (
        <View style={styles.overlayWrapper}>
          <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />
        </View>
      )}
      {activeOverlay === 'pets' && (
        <View style={styles.overlayWrapper}>
          <PetsOverlay onClose={() => setActiveOverlay(null)} />
        </View>
      )}
      {activeOverlay === 'skills' && (
        <View style={styles.overlayWrapper}>
          <SkillsOverlay onClose={() => setActiveOverlay(null)} />
        </View>
      )}
      {activeOverlay === 'store' && (
        <View style={styles.overlayWrapper}>
          <StoreOverlay onClose={() => setActiveOverlay(null)} />
        </View>
      )}
      {activeOverlay === 'zones' && (
        <View style={styles.overlayWrapper}>
          <EnemiesZonesOverlay 
            visible={true} 
            onClose={() => setActiveOverlay(null)} 
          />
        </View>
      )}
      {activeOverlay === 'equipment' && (
        <View style={styles.overlayWrapper}>
          <EquipmentOverlay 
            visible={true} 
            onClose={() => setActiveOverlay(null)} 
          />
        </View>
      )}

      {/* Ability Deck Overlay */}
      <AbilityDeckOverlay
        visible={showAbilityDeck}
        onClose={() => setShowAbilityDeck(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative', // Establish stacking context for overlays
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  topStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  topStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 4,
  },
  stageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  expBar: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  expBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expBarLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  expBarText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  expBarContainer: {
    width: '100%',
  },
  expBarBg: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  ninja: {
    position: 'absolute',
    width: NINJA_SIZE,
    height: NINJA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: NINJA_SIZE / 2,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  ninjaLevelingUp: {
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  explosionEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
    left: -20,
  },
  enemy: {
    position: 'absolute',
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ENEMY_SIZE / 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  // Removed duplicate enemyHealthBar - using the new one below
  enemyHealthFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  attackRange: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  quickActionBtn: {
    backgroundColor: '#4b5563',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#8b5cf6',
  },
  enemyCounter: {
    flex: 1,
    alignItems: 'center',
  },
  enemyCounterText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  killsText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: 8,
    zIndex: 1000, // Highest z-index to appear above overlays
    position: 'relative', // Ensure z-index takes effect
    elevation: 10, // Android-style elevation for React Native Web compatibility
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 70, // Leave space for bottom tabs
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 999, // High z-index but lower than tabs
  },
  overlayContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  comingSoonOverlay: {
    padding: 40,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // New styles for the updated UI
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  playerInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#9ca3af',
    minWidth: 80,
  },
  resources: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  combatStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  combatText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  battleArena: {
    flex: 1,
    position: 'relative',
  },
  enemyHealthBarContainer: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  enemyHealthBarBackground: {
    width: 30,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  enemyHealthBar: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  projectile: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  projectileDamage: {
    position: 'absolute',
    top: -15,
    fontSize: 8,
    color: '#fbbf24',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});