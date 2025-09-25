import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';
import { useZone } from '../src/contexts/ZoneContext';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mobile-optimized dimensions for iPhone 16 Pro Max (430x932)
const MOBILE_TOP_BAR_HEIGHT = 80;
const MOBILE_BOTTOM_NAV_HEIGHT = 90; // Increased for better touch targets
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - MOBILE_TOP_BAR_HEIGHT - MOBILE_BOTTOM_NAV_HEIGHT;
const NINJA_SIZE = 35; // Slightly smaller for mobile
const ENEMY_SIZE = 30;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'bosses' | 'zones' | 'equipment' | null;

export default function NinjaIdleGame() {
  console.log('🔄 COMPONENT RENDER - NinjaIdleGame mounting/re-rendering');
  
  // CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { gameState, isLoading: gameLoading, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat, triggerLevelUpExplosion, projectiles, updateNinjaPosition } = useCombat();
  const { currentZone, currentZoneLevel, getZoneProgress, recordEnemyKill } = useZone();
  
  // Safe area insets hook (must be called before returns)
  const insets = useSafeAreaInsets();
  
  // All state hooks must be called unconditionally
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [lastExplosionTime, setLastExplosionTime] = useState(0);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);
  const [totalKills, setTotalKills] = useState(0);
  const [lastProcessedKill, setLastProcessedKill] = useState(0);
  
  // Boss battle state
  const [isBossBattleActive, setIsBossBattleActive] = useState(false);
  const [currentBossBattle, setCurrentBossBattle] = useState<{boss: Boss, tier: BossTier} | null>(null);
  const [previousOverlay, setPreviousOverlay] = useState<ActiveOverlay>(null);
  
  // Ninja position and movement state
  const [ninjaPosition, setNinjaPosition] = useState({
    x: 50,
    y: GAME_AREA_HEIGHT - NINJA_SIZE - 50
  });
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
  const [isAttacking, setIsAttacking] = useState(false);
  const [lastAttackTime, setLastAttackTime] = useState(0);

  // TEMPORARILY FIX useCallback dependencies to stop infinite loop
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
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  const startBossBattle = useCallback((boss: Boss, tier: BossTier) => {
    console.log('🐉 Starting boss battle:', boss.name, tier.name);
    setPreviousOverlay(activeOverlay);
    setActiveOverlay(null);
    setCurrentBossBattle({ boss, tier });
    setIsBossBattleActive(true);
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

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
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  const escapeBossBattle = useCallback(() => {
    console.log('🏃 Escaping boss battle');
    
    setIsBossBattleActive(false);
    setCurrentBossBattle(null);
    
    if (previousOverlay === 'bosses') {
      setActiveOverlay('bosses');
    }
    setPreviousOverlay(null);
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  // Start combat automatically when component mounts
  useEffect(() => {
    console.log('🎮 Starting combat on component mount');
    startCombat();
    
    return () => {
      console.log('🛑 Cleaning up combat on unmount');
      stopCombat();
    };
  }, []); // Empty array - run only once
  
  // Level up detection - safe to use gameState.ninja with optional chaining
  useEffect(() => {
    const currentNinjaLevel = gameState?.ninja?.level;
    if (currentNinjaLevel && currentNinjaLevel > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', currentNinjaLevel);
      handleLevelUpExplosion();
      setPreviousLevel(currentNinjaLevel);
    }
  }, [gameState?.ninja?.level]); // Safe dependency - no function references
  
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
  
  // TEMPORARILY BYPASS ninja check to test layout
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

  // RESTORE FULL GAME INTERFACE - Step 1: Boss Battle Check
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

  // MAIN GAME INTERFACE - Mobile Optimized
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar - Mobile Optimized */}
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
                      width: `${(testNinja.experience / testNinja.experienceToNext) * 100}%` 
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
            <Ionicons name="diamond" size={14} color={MythicTechColors.neonBlue} />
            <Text style={styles.resourceValue}>{testNinja.gems}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="logo-bitcoin" size={14} color={MythicTechColors.cosmicGold} />
            <Text style={styles.resourceValue}>{testNinja.gold}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="flash" size={14} color={MythicTechColors.energyPurple} />
            <Text style={styles.resourceValue}>{testNinja.skillPoints}</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Combat UI - Skills/Abilities Bar */}
        <View style={styles.combatContainer}>
          <CombatUI onAbilityPress={(slotIndex) => {
            console.log('🎯 Ability slot pressed:', slotIndex);
            // TODO: Implement ability activation
          }} />
        </View>

        {/* Zone Info */}
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneText}>
            Zone {currentZone?.id || 1} - Level {currentZoneLevel?.levelNumber || 1}
          </Text>
          <Text style={styles.killsText}>
            Kills: {getZoneProgress(currentZone?.id || 1)?.killsInLevel || 0}/1000
          </Text>
        </View>

        {/* Ninja Character */}
        <View style={[styles.ninjaContainer, { left: ninjaPosition.x, top: ninjaPosition.y }]}>
          <View style={[styles.ninja, isAttacking && styles.ninjaAttacking, isLevelingUp && styles.ninjaLevelUp]}>
            <Text style={styles.ninjaEmoji}>🥷</Text>
          </View>
        </View>

        {/* Enemies */}
        {(combatState.enemies || []).map(enemy => (
          enemy?.position ? (
            <View 
              key={enemy.id}
              style={[
                styles.enemyContainer,
                { 
                  left: enemy.position.x, 
                  top: enemy.position.y 
                }
              ]}
            >
              <View style={styles.enemy}>
                <Text style={styles.enemyEmoji}>👹</Text>
              </View>
              <View style={styles.enemyHealthBar}>
                <View 
                  style={[
                    styles.enemyHealthFill, 
                    { width: `${(enemy.health / enemy.maxHealth) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          ) : null
        ))}

        {/* Projectiles */}
        {(projectiles || []).map(projectile => (
          projectile?.position ? (
            <View
              key={projectile.id}
              style={[
                styles.projectile,
                {
                  left: projectile.position.x - 5,
                  top: projectile.position.y - 5,
                }
              ]}
            >
              <Text style={styles.projectileText}>⭐</Text>
            </View>
          ) : null
        ))}
      </View>

      {/* Bottom Navigation - iPhone Optimized */}
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
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <Ionicons 
              name={icon as any} 
              size={22} 
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

      {/* Overlays - Conditional rendering */}
      {activeOverlay === 'stats' && (
        <View style={styles.overlayWrapper}>
          <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MythicTechColors.darkSpace,
  },
  topBar: {
    height: MOBILE_TOP_BAR_HEIGHT,
    backgroundColor: MythicTechColors.deepVoid,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: MythicTechColors.neonBlue + '44',
  },
  progressSection: {
    flex: 1,
    paddingRight: 8,
  },
  progressionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: MythicTechColors.cosmicGold,
    marginBottom: 2,
  },
  levelContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
  },
  xpContainer: {
    flex: 1,
    minWidth: 120,
  },
  xpBarBackground: {
    height: 6,
    backgroundColor: MythicTechColors.voidSilver + '33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: MythicTechColors.neonBlue,
    borderRadius: 3,
  },
  xpText: {
    fontSize: 9,
    color: MythicTechColors.voidSilver,
    marginTop: 2,
  },
  resourcesContainer: {
    flexDirection: 'column',
    gap: 4,
    minWidth: 60,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: MythicTechColors.white,
    minWidth: 35,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: MythicTechColors.darkSpace,
  },
  combatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  zoneInfo: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 2,
  },
  zoneText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
  },
  killsText: {
    fontSize: 11,
    color: MythicTechColors.voidSilver,
  },
  ninjaContainer: {
    position: 'absolute',
    width: NINJA_SIZE,
    height: NINJA_SIZE,
    zIndex: 10,
  },
  ninja: {
    width: NINJA_SIZE,
    height: NINJA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MythicTechColors.neonBlue + '22',
    borderRadius: NINJA_SIZE / 2,
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
    fontSize: 20,
  },
  enemyContainer: {
    position: 'absolute',
    width: ENEMY_SIZE,
    height: ENEMY_SIZE + 8,
    zIndex: 5,
  },
  enemy: {
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MythicTechColors.crimsonRed + '22',
    borderRadius: ENEMY_SIZE / 2,
    borderWidth: 1,
    borderColor: MythicTechColors.crimsonRed,
  },
  enemyEmoji: {
    fontSize: 16,
  },
  enemyHealthBar: {
    width: ENEMY_SIZE,
    height: 4,
    backgroundColor: MythicTechColors.voidSilver + '44',
    borderRadius: 2,
    marginTop: 2,
  },
  enemyHealthFill: {
    height: '100%',
    backgroundColor: MythicTechColors.crimsonRed,
    borderRadius: 2,
  },
  projectile: {
    position: 'absolute',
    width: 10,
    height: 10,
    zIndex: 8,
  },
  projectileText: {
    fontSize: 10,
  },
  bottomNavigation: {
    height: MOBILE_BOTTOM_NAV_HEIGHT,
    backgroundColor: MythicTechColors.deepVoid,
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: MythicTechColors.neonBlue + '44',
    zIndex: 1000,
    paddingBottom: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    pointerEvents: 'auto',
    minHeight: 60,
  },
  navButtonActive: {
    backgroundColor: MythicTechColors.neonBlue + '22',
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 9,
    color: MythicTechColors.voidSilver,
    marginTop: 2,
    textAlign: 'center',
  },
  navButtonTextActive: {
    color: MythicTechColors.neonBlue,
    fontWeight: 'bold',
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: MOBILE_BOTTOM_NAV_HEIGHT,
    zIndex: 500,
    pointerEvents: 'box-none',
  },
});
