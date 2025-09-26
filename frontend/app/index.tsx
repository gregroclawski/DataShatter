import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';
import { useZone } from '../src/contexts/ZoneContext';
import { useResponsiveLayout } from '../src/hooks/useResponsiveLayout';

// Import authentication components
import LoadingScreen from '../src/components/LoadingScreen';
import AuthScreen from '../src/components/AuthScreen';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import SkillsOverlay from '../src/components/SkillsOverlay';
import StoreOverlay from '../src/components/StoreOverlay';
import { EnemiesZonesOverlay } from '../src/components/EnemiesZonesOverlay';
import { EquipmentOverlay } from '../src/components/EquipmentOverlay';
import { BossOverlay } from '../src/components/BossOverlay';
import { BossBattleScreen } from '../src/components/BossBattleScreen';
import CombatUI from '../src/components/CombatUI';
import AbilityDeckOverlay from '../src/components/AbilityDeckOverlay';
import { Boss, BossTier } from '../src/data/BossData';

import { MythicTechColors, CharacterProgressionNames } from '../src/theme/MythicTechTheme';

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'bosses' | 'zones' | 'equipment' | null;

export default function NinjaIdleGame() {
  console.log('🔄 COMPONENT RENDER - NinjaIdleGame mounting/re-rendering');
  
  // Get responsive layout dimensions
  const layout = useResponsiveLayout();
  
  // CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { gameState, isLoading: gameLoading, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat, triggerLevelUpExplosion, projectiles, updateNinjaPosition } = useCombat();
  const { currentZone, currentZoneLevel, getZoneProgress, recordEnemyKill } = useZone();
  
  // All state hooks must be called unconditionally
  
  // Memoize dynamic styles to prevent inline object recreation causing infinite loops
  const ninjaFontStyle = useMemo(() => ({
    fontSize: layout.ninjaSize * 0.6
  }), [layout.ninjaSize]);
  
  const enemyFontStyle = useMemo(() => ({
    fontSize: layout.enemySize * 0.6
  }), [layout.enemySize]);
  
  // Helper function to get enemy health bar width (memoized per enemy)
  const getEnemyHealthWidth = useCallback((enemy: any) => ({
    width: `${Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100))}%`
  }), []);
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [lastExplosionTime, setLastExplosionTime] = useState(0);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);
  
  // Boss battle state
  const [isBossBattleActive, setIsBossBattleActive] = useState(false);
  const [currentBossBattle, setCurrentBossBattle] = useState<{boss: Boss, tier: BossTier} | null>(null);
  const [previousOverlay, setPreviousOverlay] = useState<ActiveOverlay>(null);
  
  // Mobile-compatible projectile animation system
  const [animatedProjectiles, setAnimatedProjectiles] = useState<any[]>([]);
  
  // Memoize ninja position calculation to prevent infinite re-renders on mobile
  const initialNinjaPosition = useMemo(() => ({
    x: (layout.screenWidth - layout.ninjaSize) / 2, // Center horizontally
    y: (layout.gameAreaHeight - layout.ninjaSize) / 2 // Center vertically
  }), [layout.screenWidth, layout.gameAreaHeight, layout.ninjaSize, layout.paddingXL]);
  
  const [ninjaPosition, setNinjaPosition] = useState(initialNinjaPosition);
  const [isAttacking, setIsAttacking] = useState(false);

  // Soft Joystick Movement System - Mobile Optimized
  const translateX = useSharedValue(ninjaPosition.x);
  const translateY = useSharedValue(ninjaPosition.y);
  
  // Joystick state - FIXED: Use shared values to prevent race conditions
  const [joystickVisible, setJoystickVisible] = useState(false);
  const joystickBaseX = useSharedValue(0);
  const joystickBaseY = useSharedValue(0);
  const joystickKnobX = useSharedValue(0);
  const joystickKnobY = useSharedValue(0);
  const knobOffsetX = useSharedValue(0);
  const knobOffsetY = useSharedValue(0);

  // Initialize animated values when layout changes
  useEffect(() => {
    translateX.value = ninjaPosition.x;
    translateY.value = ninjaPosition.y;
  }, [ninjaPosition.x, ninjaPosition.y, translateX, translateY]);

  // MOBILE FIX: Removed problematic useEffect animation loop that was accessing shared values from main thread
  // Movement now handled entirely within gesture worklets for proper React Native threading

  // Create touch gesture for joystick control - FIXED: Using worklets and shared values
  const touchGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      // Show joystick at touch position using shared values
      const touchX = event.x;
      const touchY = event.y;
      
      joystickBaseX.value = touchX;
      joystickBaseY.value = touchY;
      joystickKnobX.value = touchX;
      joystickKnobY.value = touchY;
      knobOffsetX.value = 0;
      knobOffsetY.value = 0;
      
      // Show joystick on main thread
      runOnJS(setJoystickVisible)(true);
      runOnJS(console.log)('🕹️ Joystick appeared at:', { x: touchX, y: touchY });
    })
    .onUpdate((event) => {
      'worklet';
      // Update joystick knob position using shared values only
      const maxDistance = 40;
      const baseX = joystickBaseX.value;
      const baseY = joystickBaseY.value;
      const deltaX = event.x - baseX;
      const deltaY = event.y - baseY;
      
      // Limit knob distance from base
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const limitedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);
      
      const knobX = Math.cos(angle) * limitedDistance;
      const knobY = Math.sin(angle) * limitedDistance;
      
      // Update shared values for animation
      knobOffsetX.value = knobX;
      knobOffsetY.value = knobY;
      joystickKnobX.value = baseX + knobX;
      joystickKnobY.value = baseY + knobY;
    })
    .onEnd(() => {
      'worklet';
      // Hide joystick and reset values
      knobOffsetX.value = 0;
      knobOffsetY.value = 0;
      
      const finalPosition = {
        x: translateX.value,
        y: translateY.value
      };
      
      // Update on main thread
      runOnJS(setJoystickVisible)(false);
      runOnJS(setNinjaPosition)(finalPosition);
      runOnJS(console.log)('🕹️ Joystick hidden, ninja final position:', finalPosition);
    });

  // Animated style for ninja position
  const animatedNinjaStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ]
    };
  });

  // Joystick base animated style
  const joystickBaseStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: joystickBaseX.value - 40 },
        { translateY: joystickBaseY.value - 40 }
      ]
    };
  });

  // Joystick knob animated style
  const joystickKnobStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: joystickKnobX.value - 15 },
        { translateY: joystickKnobY.value - 15 }
      ]
    };
  });

  // Use useRef to track previous position and prevent infinite loops
  const previousLayoutRef = useRef({
    screenWidth: layout.screenWidth,
    gameAreaHeight: layout.gameAreaHeight,
    ninjaSize: layout.ninjaSize,
    paddingXL: layout.paddingXL
  });

  // Update ninja position when layout changes (mobile-stable, no circular dependency)
  useEffect(() => {
    const newPosition = {
      x: (layout.screenWidth - layout.ninjaSize) / 2, // Center horizontally
      y: (layout.gameAreaHeight - layout.ninjaSize) / 2 // Center vertically
    };
    
    // Check if layout actually changed to prevent unnecessary updates
    const prevLayout = previousLayoutRef.current;
    const layoutChanged = 
      Math.abs(layout.screenWidth - prevLayout.screenWidth) > 5 ||
      Math.abs(layout.gameAreaHeight - prevLayout.gameAreaHeight) > 5 ||
      Math.abs(layout.ninjaSize - prevLayout.ninjaSize) > 2 ||
      Math.abs(layout.paddingXL - prevLayout.paddingXL) > 2;
    
    if (layoutChanged) {
      console.log('📱 Layout changed, updating ninja position');
      setNinjaPosition(newPosition);
      
      // Update ref to current layout values
      previousLayoutRef.current = {
        screenWidth: layout.screenWidth,
        gameAreaHeight: layout.gameAreaHeight,
        ninjaSize: layout.ninjaSize,
        paddingXL: layout.paddingXL
      };
    }
  }, [layout.screenWidth, layout.gameAreaHeight, layout.ninjaSize, layout.paddingXL]); // NO ninjaPosition dependencies!

  // Mobile-compatible projectile animation system - replaces web-specific requestAnimationFrame
  useEffect(() => {
    const animateProjectiles = () => {
      setAnimatedProjectiles(currentProjectiles => {
        return (projectiles || []).map(projectile => {
          if (!projectile) return null;
          
          // Calculate projectile flight progress (0 to 1)
          const startTime = projectile.startTime || Date.now();
          const elapsedTime = Date.now() - startTime;
          const flightDuration = projectile.duration || 500; // Use projectile's duration
          const progress = Math.min(elapsedTime / flightDuration, 1);
          
          // Interpolate position from ninja to target
          const currentX = projectile.x + (projectile.targetX - projectile.x) * progress;
          const currentY = projectile.y + (projectile.targetY - projectile.y) * progress;
          
          return {
            ...projectile,
            currentX,
            currentY,
            progress
          };
        }).filter(Boolean);
      });
    };

    // Mobile-compatible animation loop using setInterval instead of requestAnimationFrame
    const projectileAnimationInterval = setInterval(animateProjectiles, 16); // ~60fps
    
    return () => clearInterval(projectileAnimationInterval);
  }, [projectiles]);

  // Level up explosion handler
  const handleLevelUpExplosion = useCallback(() => {
    const now = Date.now();
    const EXPLOSION_COOLDOWN = 5000;
    
    if (now - lastExplosionTime < EXPLOSION_COOLDOWN) {
      console.log('💥 LEVEL UP EXPLOSION on cooldown, skipping...');
      return;
    }
    
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    setLastExplosionTime(now);
    
    triggerLevelUpExplosion();
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, [lastExplosionTime, triggerLevelUpExplosion]);

  const startBossBattle = useCallback((boss: Boss, tier: BossTier) => {
    console.log('🐉 Starting boss battle:', boss.name, tier.name);
    setPreviousOverlay(activeOverlay);
    setActiveOverlay(null);
    setCurrentBossBattle({ boss, tier });
    setIsBossBattleActive(true);
  }, [activeOverlay]);

  const endBossBattle = useCallback(async (victory: boolean) => {
    console.log('🏆 Boss battle ended:', victory ? 'Victory' : 'Defeat');
    
    if (!currentBossBattle) return;
    
    setIsBossBattleActive(false);
    setCurrentBossBattle(null);
    
    if (previousOverlay === 'bosses') {
      setActiveOverlay('bosses');
    }
    setPreviousOverlay(null);
    
    Alert.alert(
      victory ? '🏆 Victory!' : '💀 Defeat',
      victory 
        ? `You defeated ${currentBossBattle.tier.name}! Check the boss overlay for rewards.`
        : `${currentBossBattle.tier.name} was too powerful. Try again when stronger!`,
      [{ text: 'OK' }]
    );
  }, [currentBossBattle, previousOverlay]);

  const escapeBossBattle = useCallback(() => {
    console.log('🏃 Escaping boss battle');
    
    setIsBossBattleActive(false);
    setCurrentBossBattle(null);
    
    if (previousOverlay === 'bosses') {
      setActiveOverlay('bosses');
    }
    setPreviousOverlay(null);
  }, [previousOverlay]);

  // Start combat automatically when component mounts
  useEffect(() => {
    console.log('🎮 Starting combat on component mount');
    startCombat();
    
    return () => {
      console.log('🛑 Cleaning up combat on unmount');
      stopCombat();
    };
  }, [startCombat, stopCombat]);
  
  // Level up detection - safe to use gameState.ninja with optional chaining
  useEffect(() => {
    const currentNinjaLevel = gameState?.ninja?.level;
    if (currentNinjaLevel && currentNinjaLevel > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', currentNinjaLevel);
      handleLevelUpExplosion();
      setPreviousLevel(currentNinjaLevel);
    }
  }, [gameState?.ninja?.level, previousLevel, handleLevelUpExplosion]);
  
  // Authentication flow - AFTER all hooks are declared
  console.log('🔍 MAIN COMPONENT - Authentication Check:');
  console.log('  - authLoading:', authLoading);
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - user exists:', !!user);
  console.log('  - gameLoading:', gameLoading);
  
  if (authLoading) {
    console.log('🔐 AUTH LOADING - showing auth loading screen');
    return <LoadingScreen message="Initializing authentication..." />;
  }

  if (!isAuthenticated) {
    console.log('🔐 NOT AUTHENTICATED - showing auth screen');
    return <AuthScreen />;
  }

  if (gameLoading) {
    console.log('🎮 GAME LOADING - showing game loading screen');
    return <LoadingScreen message="Loading your ninja profile..." />;
  }
  
  // Initialize ninja data AFTER all loading checks
  const ninja = gameState?.ninja;
  
  console.log('🎯 NINJA CHECK:', { 
    ninja: !!ninja, 
    gameState: !!gameState, 
    authLoading, 
    gameLoading, 
    isAuthenticated 
  });
  
  // Create default ninja if missing to test UI
  const testNinja = ninja || {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    gold: 100,
    gems: 10,
    skillPoints: 0
  };
  
  // Get current character progression based on level
  const getCharacterProgression = (level: number) => {
    if (level >= 15000) return CharacterProgressionNames[15000];
    if (level >= 10000) return CharacterProgressionNames[10000];
    if (level >= 5000) return CharacterProgressionNames[5000];
    return CharacterProgressionNames[1];
  };

  const currentProgression = testNinja ? getCharacterProgression(testNinja.level) : CharacterProgressionNames[1];

  console.log('🎯 ABOUT TO RENDER FULL GAME UI - testNinja:', testNinja);
  console.log('🎯 PROGRESSION:', currentProgression);

  // Boss Battle Check
  if (isBossBattleActive && currentBossBattle) {
    return (
      <BossBattleScreen
        boss={currentBossBattle.boss}
        tier={currentBossBattle.tier}
        onVictory={() => endBossBattle(true)}
        onDefeat={() => endBossBattle(false)}
        onEscape={escapeBossBattle}
      />
    );
  }

  // Create responsive styles
  const styles = createResponsiveStyles(layout);

  // MAIN GAME INTERFACE - Fully Responsive
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar - Responsive */}
      <View style={styles.topBar}>
        <View style={styles.progressSection}>
          <Text style={styles.progressionTitle}>
            {currentProgression?.title || 'Digital Initiate'}
          </Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {testNinja?.level || 1}</Text>
            <View style={styles.xpContainer}>
              <View style={styles.xpBarBackground}>
                <View 
                  style={[
                    styles.xpBarFill, 
                    { 
                      width: `${Math.max(0, Math.min(100, (testNinja.experience / testNinja.experienceToNext) * 100))}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.xpText}>
                {testNinja.experience} / {testNinja.experienceToNext} XP
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.resourcesContainer}>
          <View style={styles.resourceItem}>
            <Ionicons name="diamond" size={layout.iconSize} color={MythicTechColors.neonBlue} />
            <Text style={styles.resourceValue}>{testNinja.gems}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="logo-bitcoin" size={layout.iconSize} color={MythicTechColors.cosmicGold} />
            <Text style={styles.resourceValue}>{testNinja.gold}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="flash" size={layout.iconSize} color={MythicTechColors.energyPurple} />
            <Text style={styles.resourceValue}>{testNinja.skillPoints}</Text>
          </View>
        </View>
      </View>

      {/* Game Area - Responsive */}
      <View style={styles.gameArea}>
        {/* Zone Info */}
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneText}>
            Zone {currentZone?.id || 1} - Level {currentZoneLevel?.levelNumber || 1}
          </Text>
          <Text style={styles.killsText}>
            Kills: {getZoneProgress(currentZone?.id || 1)?.killsInLevel || 0}/1000
          </Text>
        </View>

        {/* Game Area Touch Surface for Joystick Control */}
        <GestureDetector gesture={touchGesture}>
          <View style={styles.touchSurface}>
            {/* Ninja Character - Responsive with Joystick Movement */}
            <Animated.View style={[
              styles.ninjaContainer, 
              { 
                width: layout.ninjaSize,
                height: layout.ninjaSize 
              },
              animatedNinjaStyle
            ]}>
              <View style={[
                styles.ninja, 
                { 
                  width: layout.ninjaSize, 
                  height: layout.ninjaSize,
                  borderRadius: layout.ninjaSize / 2
                },
                isAttacking && styles.ninjaAttacking, 
                isLevelingUp && styles.ninjaLevelUp
              ]}>
                <Text style={[styles.ninjaEmoji, ninjaFontStyle]}>🥷</Text>
              </View>
            </Animated.View>

            {/* Soft Joystick - Shows when touching screen */}
            {joystickVisible && (
              <>
                {/* Joystick Base */}
                <Animated.View style={[styles.joystickBase, joystickBaseStyle]}>
                  <View style={styles.joystickBaseInner} />
                </Animated.View>
                
                {/* Joystick Knob */}
                <Animated.View style={[styles.joystickKnob, joystickKnobStyle]}>
                  <View style={styles.joystickKnobInner} />
                </Animated.View>
              </>
            )}
          </View>
        </GestureDetector>

        {/* Enemies - Responsive */}
        {(combatState.enemies || []).map(enemy => (
          enemy?.position ? (
            <View 
              key={enemy.id}
              style={[
                styles.enemyContainer,
                { 
                  left: enemy.position.x, 
                  top: enemy.position.y,
                  width: layout.enemySize,
                  height: layout.enemySize + 8
                }
              ]}
            >
              <View style={[
                styles.enemy,
                {
                  width: layout.enemySize,
                  height: layout.enemySize,
                  borderRadius: layout.enemySize / 2
                }
              ]}>
                <Text style={[styles.enemyEmoji, enemyFontStyle]}>👹</Text>
              </View>
              <View style={[styles.enemyHealthBar, { width: layout.enemySize }]}>
                <View 
                  style={[
                    styles.enemyHealthFill, 
                    getEnemyHealthWidth(enemy)
                  ]} 
                />
              </View>
            </View>
          ) : null
        ))}

        {/* Projectiles - Mobile-optimized animation */}
        {(animatedProjectiles || []).map(projectile => (
          projectile ? (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                {
                  left: (projectile.currentX || projectile.x) - layout.paddingXS,
                  top: (projectile.currentY || projectile.y) - layout.paddingXS,
                }
              ]}
            >
              <Text style={[styles.projectileText, { fontSize: layout.smallFontSize }]}>⭐</Text>
            </View>
          ) : null
        ))}

        {/* Combat UI - Responsive positioning */}
        <CombatUI 
          layout={layout}
          onAbilityPress={(slotIndex) => {
            console.log('🎯 Ability slot pressed:', slotIndex);
            // TODO: Implement ability activation
          }} 
        />
      </View>

      {/* Bottom Navigation - Fully Responsive */}
      <View style={styles.bottomNavigation}>
        {[
          { key: 'stats', icon: 'stats-chart', label: 'Stats' },
          { key: 'equipment', icon: 'shield', label: 'Equipment' },
          { key: 'pets', icon: 'paw', label: 'Pets' },
          { key: 'skills', icon: 'flash', label: 'Skills' },
          { key: 'store', icon: 'storefront', label: 'Store' },
          { key: 'bosses', icon: 'skull', label: 'Bosses' },
          { key: 'zones', icon: 'map', label: 'Zones' },
        ].map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.navButton, activeOverlay === key && styles.navButtonActive]}
            onPress={() => {
              console.log(`🎯 Tab pressed: ${key}`);
              setActiveOverlay(activeOverlay === key ? null : key as ActiveOverlay);
            }}
            activeOpacity={0.7}
            hitSlop={{ 
              top: layout.paddingS, 
              bottom: layout.paddingS, 
              left: layout.paddingXS, 
              right: layout.paddingXS 
            }}
          >
            <Ionicons 
              name={icon as any} 
              size={layout.iconSize} 
              color={activeOverlay === key ? MythicTechColors.neonBlue : MythicTechColors.voidSilver} 
            />
            <Text style={[
              styles.navButtonText, 
              activeOverlay === key && styles.navButtonTextActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlays - Responsive */}
      {activeOverlay === 'stats' && (
        <View style={styles.overlayWrapper}>
          <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} layout={layout} />
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
      {activeOverlay === 'bosses' && (
        <View style={styles.overlayWrapper}>
          <BossOverlay 
            visible={true}
            onClose={() => setActiveOverlay(null)}
            onStartBossBattle={startBossBattle}
          />
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

      {showAbilityDeck && (
        <AbilityDeckOverlay onClose={() => setShowAbilityDeck(false)} />
      )}
    </SafeAreaView>
  );
}

// Create responsive styles function
function createResponsiveStyles(layout: ReturnType<typeof useResponsiveLayout>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: MythicTechColors.shadowGrid, // Changed from darkSpace for mobile visibility
    },
    topBar: {
      height: layout.topBarHeight,
      backgroundColor: MythicTechColors.deepVoid,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.paddingM,
      // No additional paddingTop since topBarHeight already includes safe area
      paddingVertical: layout.paddingS,
      borderBottomWidth: 2,
      borderBottomColor: MythicTechColors.neonBlue + '44',
      // Ensure proper z-index for mobile
      zIndex: 35,
      // Mobile-optimized shadow
      ...(Platform.OS === 'ios' ? {
        shadowColor: MythicTechColors.neonBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      } : {
        elevation: 4,
      }),
    },
    progressSection: {
      flex: 1,
      paddingRight: layout.paddingS,
      // Mobile-first: Use flex layout instead of absolute positioning
      // This works properly with SafeAreaView and parent topBar container
      justifyContent: 'flex-start',
      // Higher z-index for visibility (but use flex layout, not absolute positioning)
      zIndex: 40,
    },
    progressionTitle: {
      fontSize: layout.smallFontSize,
      fontWeight: 'bold',
      color: MythicTechColors.cosmicGold,
      marginBottom: layout.paddingXS * 0.5,
    },
    levelContainer: {
      flexDirection: 'column',
      gap: layout.paddingXS,
    },
    levelText: {
      fontSize: layout.titleFontSize,
      fontWeight: 'bold',
      color: MythicTechColors.neonBlue,
    },
    xpContainer: {
      width: '100%',
      maxWidth: layout.screenWidth * 0.4,
    },
    xpBarBackground: {
      height: Math.max(4, layout.paddingXS * 0.75),
      backgroundColor: MythicTechColors.voidSilver + '33',
      borderRadius: layout.paddingXS * 0.375,
      overflow: 'hidden',
    },
    xpBarFill: {
      height: '100%',
      backgroundColor: MythicTechColors.neonBlue,
      borderRadius: layout.paddingXS * 0.375,
    },
    xpText: {
      fontSize: layout.smallFontSize * 0.9,
      color: MythicTechColors.voidSilver,
      marginTop: layout.paddingXS * 0.5,
    },
    resourcesContainer: {
      flexDirection: 'column',
      gap: layout.paddingXS,
      minWidth: layout.screenWidth * 0.15,
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: layout.paddingXS,
    },
    resourceValue: {
      fontSize: layout.bodyFontSize,
      fontWeight: 'bold',
      color: MythicTechColors.white,
      minWidth: layout.screenWidth * 0.1,
    },
    gameArea: {
      flex: 1,
      position: 'relative',
      zIndex: 1, // Ensure proper stacking order
      backgroundColor: MythicTechColors.shadowGrid, // Changed from darkSpace for mobile visibility
    },
    zoneInfo: {
      position: 'absolute',
      top: layout.paddingS,
      left: layout.paddingM,
      zIndex: 2,
      backgroundColor: MythicTechColors.deepVoid + 'cc', // Increased opacity for mobile visibility
      borderWidth: 2,
      borderColor: MythicTechColors.neonBlue,
      paddingHorizontal: layout.paddingS,
      paddingVertical: layout.paddingXS,
      borderRadius: layout.paddingS,
    },
    zoneText: {
      fontSize: layout.titleFontSize,
      fontWeight: 'bold',
      color: MythicTechColors.neonBlue,
    },
    killsText: {
      fontSize: layout.bodyFontSize,
      color: MythicTechColors.voidSilver,
    },
    touchSurface: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10, // Above game area but below UI elements
    },
    ninjaContainer: {
      position: 'absolute',
      // Higher z-index to ensure ninja appears above skill bar (Combat UI has zIndex: 30)
      zIndex: 50,
      // Start position will be controlled by transform
      left: 0,
      top: 0,
    },
    ninja: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: MythicTechColors.neonBlue + '22',
      borderWidth: 3, // Increased for mobile visibility
      borderColor: MythicTechColors.neonBlue,
    },
    ninjaAttacking: {
      backgroundColor: MythicTechColors.energyPurple + '44',
      borderColor: MythicTechColors.energyPurple,
      transform: [{ scale: 1.2 }],
    },
    ninjaLevelUp: {
      backgroundColor: MythicTechColors.cosmicGold + '44',
      borderColor: MythicTechColors.cosmicGold,
      transform: [{ scale: 1.3 }],
    },
    ninjaEmoji: {
      // fontSize is set dynamically
    },
    enemyContainer: {
      position: 'absolute',
      // Higher z-index to ensure enemies appear above skill bar (Combat UI has zIndex: 30)
      zIndex: 45,
    },
    enemy: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: MythicTechColors.crimsonRed + '22',
      borderWidth: 1,
      borderColor: MythicTechColors.crimsonRed,
    },
    enemyEmoji: {
      // fontSize is set dynamically
    },
    enemyHealthBar: {
      height: Math.max(3, layout.paddingXS * 0.5),
      backgroundColor: MythicTechColors.voidSilver + '44',
      borderRadius: layout.paddingXS * 0.25,
      marginTop: layout.paddingXS * 0.5,
    },
    enemyHealthFill: {
      height: '100%',
      backgroundColor: MythicTechColors.crimsonRed,
      borderRadius: layout.paddingXS * 0.25,
    },
    projectile: {
      position: 'absolute',
      width: layout.paddingS + layout.paddingXS,
      height: layout.paddingS + layout.paddingXS,
      zIndex: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectileText: {
      // fontSize is set dynamically
    },
    bottomNavigation: {
      height: layout.bottomNavHeight,
      backgroundColor: MythicTechColors.deepVoid,
      flexDirection: 'row',
      borderTopWidth: 2,
      borderTopColor: MythicTechColors.neonBlue + '44',
      zIndex: 1000,
      paddingBottom: layout.bottomInset * 0.5,
      paddingHorizontal: layout.paddingXS,
      elevation: 1000,
    },
    navButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: layout.paddingS,
      paddingHorizontal: layout.paddingXS,
      // Use platform-specific minimum touch targets for mobile accessibility
      minHeight: Math.max(layout.tabTouchTarget, layout.bottomNavHeight * 0.8),
      borderRadius: layout.paddingS,
      marginHorizontal: layout.paddingXS * 0.5,
      // Platform-specific touch feedback
      ...(Platform.OS === 'ios' ? {
        // iOS shadow for better touch feedback
        shadowColor: MythicTechColors.neonBlue,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      } : {
        // Android elevation for material design
        elevation: 1,
      }),
    },
    navButtonActive: {
      backgroundColor: MythicTechColors.neonBlue + '22',
      transform: [{ scale: 1.05 }],
    },
    navButtonText: {
      fontSize: layout.smallFontSize,
      color: MythicTechColors.voidSilver,
      marginTop: layout.paddingXS,
      textAlign: 'center',
      fontWeight: '600',
    },
    navButtonTextActive: {
      color: MythicTechColors.neonBlue,
      fontWeight: 'bold',
    },
    overlayWrapper: {
      position: 'absolute',
      // Proper safe area handling for mobile devices
      top: layout.topInset,
      left: layout.leftInset,
      right: layout.rightInset,
      bottom: layout.bottomNavHeight + layout.bottomInset,
      zIndex: 500,
      backgroundColor: MythicTechColors.darkSpace + 'cc',
    },
    // Joystick Styles
    joystickBase: {
      position: 'absolute',
      width: 80,
      height: 80,
      zIndex: 100,
      pointerEvents: 'none',
    },
    joystickBaseInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: MythicTechColors.neonBlue + '40', // Semi-transparent
      borderWidth: 2,
      borderColor: MythicTechColors.neonBlue + '80',
    },
    joystickKnob: {
      position: 'absolute',
      width: 30,
      height: 30,
      zIndex: 101,
      pointerEvents: 'none',
    },
    joystickKnobInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: MythicTechColors.neonBlue,
      borderWidth: 2,
      borderColor: MythicTechColors.white,
      // Mobile-compatible shadow
      ...(Platform.OS === 'ios' ? {
        shadowColor: MythicTechColors.neonBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      } : {
        elevation: 6,
      }),
    },
  });
}