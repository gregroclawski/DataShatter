import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
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
  
  // Memoize ninja position calculation to prevent infinite re-renders on mobile
  const initialNinjaPosition = useMemo(() => ({
    x: layout.screenWidth * 0.1, // 10% from left
    y: layout.gameAreaHeight - layout.ninjaSize - layout.paddingXL
  }), [layout.screenWidth, layout.gameAreaHeight, layout.ninjaSize, layout.paddingXL]);
  
  const [ninjaPosition, setNinjaPosition] = useState(initialNinjaPosition);
  const [isAttacking, setIsAttacking] = useState(false);

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
      x: layout.screenWidth * 0.1,
      y: layout.gameAreaHeight - layout.ninjaSize - layout.paddingXL
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
          <Text style={styles.progressionTitle}>{currentProgression.title}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {testNinja.level}</Text>
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

        {/* Ninja Character - Responsive */}
        <View style={[styles.ninjaContainer, { 
          left: ninjaPosition.x, 
          top: ninjaPosition.y,
          width: layout.ninjaSize,
          height: layout.ninjaSize 
        }]}>
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
        </View>

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

        {/* Projectiles - Responsive */}
        {(projectiles || []).map(projectile => (
          projectile ? (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                {
                  left: projectile.x - layout.paddingXS,
                  top: projectile.y - layout.paddingXS,
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
          <EquipmentOverlay onClose={() => setActiveOverlay(null)} />
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
            onClose={() => setActiveOverlay(null)}
            onStartBossBattle={startBossBattle}
          />
        </View>
      )}
      {activeOverlay === 'zones' && (
        <View style={styles.overlayWrapper}>
          <EnemiesZonesOverlay onClose={() => setActiveOverlay(null)} />
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
      backgroundColor: MythicTechColors.darkSpace,
    },
    topBar: {
      height: layout.topBarHeight,
      backgroundColor: MythicTechColors.deepVoid,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.paddingM,
      paddingTop: layout.topInset * 0.5,
      borderBottomWidth: 2,
      borderBottomColor: MythicTechColors.neonBlue + '44',
    },
    progressSection: {
      flex: 1,
      paddingRight: layout.paddingS,
      // Use absolute positioning with proper SafeAreaView integration for mobile
      position: 'absolute',
      top: layout.topInset + 5, // Add small offset from safe area
      left: layout.paddingM,
      right: layout.paddingM,
      // Higher z-index to ensure header appears above all game elements
      zIndex: 40,
      // Mobile-optimized height
      height: 60,
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
      flex: 1,
      minWidth: layout.screenWidth * 0.3,
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
      backgroundColor: MythicTechColors.darkSpace,
    },
    zoneInfo: {
      position: 'absolute',
      top: layout.paddingS,
      left: layout.paddingM,
      zIndex: 2,
      backgroundColor: MythicTechColors.deepVoid + '88',
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
    ninjaContainer: {
      position: 'absolute',
      // Higher z-index to ensure ninja appears above skill bar (Combat UI has zIndex: 30)
      zIndex: 50,
    },
    ninja: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: MythicTechColors.neonBlue + '22',
      borderWidth: 2,
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
  });
}