import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import SkillsOverlay from '../src/components/SkillsOverlay';
import StoreOverlay from '../src/components/StoreOverlay';
import CombatUI from '../src/components/CombatUI';
import AbilityDeckOverlay from '../src/components/AbilityDeckOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 250; // Leave space for bottom tabs
const NINJA_SIZE = 40;
const ENEMY_SIZE = 35;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'raids' | null;

export default function NinjaIdleGame() {
  const { gameState, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat } = useCombat();
  
  const ninja = gameState?.ninja;
  
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);
  const [totalKills, setTotalKills] = useState(0);
  const [lastProcessedKill, setLastProcessedKill] = useState(0);
  const [projectiles, setProjectiles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
  }>>([]);

  const insets = useSafeAreaInsets();

  // Level-up explosion attack
  const triggerLevelUpExplosion = useCallback(() => {
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, []);

  // Watch for level changes to trigger explosion
  useEffect(() => {
    if (ninja && ninja.level > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', ninja.level);
      triggerLevelUpExplosion();
      setPreviousLevel(ninja.level);
    }
  }, [ninja?.level, previousLevel, triggerLevelUpExplosion]);

  // Award XP only for NEW kills (incremental, respects level-up resets)
  useEffect(() => {
    if (totalKills > lastProcessedKill) {
      const newKills = totalKills - lastProcessedKill;
      const xpPerKill = 50;
      const goldPerKill = 10;
      
      const totalXP = newKills * xpPerKill;
      const totalGold = newKills * goldPerKill;
      
      console.log(`📊 Awarding XP for ${newKills} new kills: +${totalXP} XP, +${totalGold} gold`);
      
      updateNinja((prev) => ({
        experience: prev.experience + totalXP,
        gold: prev.gold + totalGold,
      }));
      
      setLastProcessedKill(totalKills);
    }
  }, [totalKills, lastProcessedKill]);

  // Find closest enemy for projectile targeting
  const findClosestEnemy = useCallback(() => {
    if (!combatState.enemies || combatState.enemies.length === 0) return null;
    
    const ninjaX = SCREEN_WIDTH / 2;
    const ninjaY = GAME_AREA_HEIGHT / 2;
    
    let closestEnemy = combatState.enemies[0];
    let closestDistance = Infinity;
    
    combatState.enemies.forEach(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - ninjaX, 2) + 
        Math.pow(enemy.position.y - ninjaY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });
    
    return closestEnemy;
  }, [combatState.enemies]);

  // Create projectile targeting closest enemy
  const createProjectile = useCallback(() => {
    const targetEnemy = findClosestEnemy();
    if (!targetEnemy) return;
    
    const ninjaX = SCREEN_WIDTH / 2;
    const ninjaY = GAME_AREA_HEIGHT / 2;
    const ENEMY_SIZE = 35; // Define enemy size here
    
    const projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      x: ninjaX,
      y: ninjaY,
      targetX: targetEnemy.position.x + ENEMY_SIZE / 2,
      targetY: targetEnemy.position.y + ENEMY_SIZE / 2,
      startTime: Date.now(),
      duration: 500, // 500ms travel time
    };
    
    console.log(`🔥 Creating projectile to closest enemy at (${targetEnemy.position.x}, ${targetEnemy.position.y}) distance: ${Math.sqrt(Math.pow(targetEnemy.position.x - ninjaX, 2) + Math.pow(targetEnemy.position.y - ninjaY, 2)).toFixed(0)}`);
    
    setProjectiles(prev => [...prev, projectile]);
    
    // Remove projectile after it hits
    setTimeout(() => {
      setProjectiles(prev => prev.filter(p => p.id !== projectile.id));
    }, 500);
  }, [findClosestEnemy]);

  // Listen for combat logs and count kills
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
          return newTotal;
        });
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // Create projectiles when abilities are cast (separate effect)
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog(...args);
      
      const message = args.join(' ');
      
      // Check for ability cast messages to create projectiles
      if ((message.includes('Fire Shuriken cast!') || message.includes('Basic Shuriken cast!')) && combatState.enemies.length > 0) {
        console.log('🔥 Detected ability cast, creating projectile to closest enemy...');
        createProjectile();
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, [combatState.enemies.length, createProjectile]); // Only depend on enemy count, not full array

  // Projectile animation loop
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setProjectiles(prev => [...prev]); // Force re-render for smooth animation
    }, 16); // ~60 FPS
    
    return () => clearInterval(animationInterval);
  }, []);

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
    { id: 'raids', name: 'Raids', icon: 'nuclear' },
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
          <Text style={[styles.combatText, { 
            color: combatState.isInCombat ? '#10b981' : '#ef4444' 
          }]}>
            {combatState.isInCombat ? 'In Combat' : 'Paused'}
          </Text>
        </View>

        {/* Battle Arena */}
        <View style={styles.battleArena}>
          {/* Ninja Character - Fixed position for new system */}
          <View
            style={[
              styles.ninja,
              {
                left: SCREEN_WIDTH / 2 - NINJA_SIZE / 2,
                top: GAME_AREA_HEIGHT / 2 - NINJA_SIZE / 2,
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
          ) : (
            <Text style={{color: 'red', position: 'absolute', top: 50, left: 50}}>No enemies in array</Text>
          )}

          {/* Projectiles */}
          {console.log(`🔥 Projectiles array length: ${projectiles.length}`) || null}
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
              if (tab.id === 'abilities') {
                setShowAbilityDeck(true);
              } else {
                setActiveOverlay(tab.id as ActiveOverlay);
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

      {/* Overlays */}
      {activeOverlay && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.overlayContainer}>
            {activeOverlay === 'stats' && <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'pets' && <PetsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'skills' && <SkillsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'store' && <StoreOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'raids' && (
              <View style={styles.comingSoonOverlay}>
                <Ionicons name="construct" size={60} color="#8b5cf6" />
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                  Raid battles will be available in the next update.
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setActiveOverlay(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
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
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
});