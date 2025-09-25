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

  // ALL useCallback hooks must be declared before returns
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
  }, [triggerLevelUpExplosion, lastExplosionTime]);

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

  // ESSENTIAL useEffect hooks - carefully added back without infinite loop issues
  
  // Start combat once when component mounts (no dependencies to prevent loop)
  useEffect(() => {
    console.log('🎮 Starting combat on component mount');
    startCombat();
    
    return () => {
      console.log('🛑 Cleaning up combat on unmount');
      stopCombat();
    };
  }, []); // Empty array - run only once
  
  // TEMPORARILY DISABLED OTHER EFFECTS TO PREVENT LOOPS
  
  // Authentication flow - AFTER all hooks are declared
  if (authLoading) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (gameLoading) {
    return <LoadingScreen message="Loading your ninja profile..." />;
  }
  
  // Initialize ninja data AFTER all loading checks
  const ninja = gameState?.ninja;
  
  // Ensure ninja is initialized before proceeding
  if (!ninja) {
    console.log('⏳ Waiting for ninja data to initialize...');
    return <LoadingScreen message="Initializing ninja data..." />;
  }
  
  // Get current character progression based on level
  const getCharacterProgression = (level: number) => {
    if (level >= 15000) return CharacterProgressionNames[15000];
    if (level >= 10000) return CharacterProgressionNames[10000];
    if (level >= 5000) return CharacterProgressionNames[5000];
    return CharacterProgressionNames[1];
  };

  const currentProgression = ninja ? getCharacterProgression(ninja.level) : CharacterProgressionNames[1];

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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.progressSection}>
          <Text style={styles.progressionTitle}>{currentProgression.title}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {ninja?.level || 1}</Text>
            <View style={styles.xpContainer}>
              <View style={styles.xpBarBackground}>
                <View 
                  style={[
                    styles.xpBarFill, 
                    { 
                      width: `${ninja ? (ninja.experience / ninja.experienceToNext) * 100 : 0}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.xpText}>
                {ninja?.experience || 0} / {ninja?.experienceToNext || 100} XP
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.resourcesContainer}>
          <View style={styles.resourceItem}>
            <Ionicons name="diamond" size={14} color={MythicTechColors.neonBlue} />
            <Text style={styles.resourceValue}>{ninja?.gems || 0}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="logo-bitcoin" size={14} color={MythicTechColors.cosmicGold} />
            <Text style={styles.resourceValue}>{ninja?.gold || 0}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="flash" size={14} color={MythicTechColors.energyPurple} />
            <Text style={styles.resourceValue}>{ninja?.skillPoints || 0}</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Combat UI */}
        <View style={styles.combatContainer}>
          <CombatUI />
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

      {/* Bottom Navigation */}
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
            onPress={() => setActiveOverlay(activeOverlay === key ? null : key as ActiveOverlay)}
          >
            <Ionicons 
              name={icon as any} 
              size={20} 
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

      {/* Overlays */}
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
    paddingHorizontal: 12, // Reduced padding for mobile
    borderBottomWidth: 2,
    borderBottomColor: MythicTechColors.neonBlue + '44',
  },
  progressSection: {
    flex: 1,
    paddingRight: 8,
  },
  progressionTitle: {
    fontSize: 12, // Smaller for mobile
    fontWeight: 'bold',
    color: MythicTechColors.cosmicGold,
    marginBottom: 2,
  },
  levelContainer: {
    flexDirection: 'column', // Stack vertically on mobile
    gap: 4,
  },
  levelText: {
    fontSize: 14, // Smaller for mobile
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
  },
  xpContainer: {
    flex: 1,
    minWidth: 120, // Ensure minimum width
  },
  xpBarBackground: {
    height: 6, // Thinner for mobile
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
    fontSize: 9, // Smaller for mobile
    color: MythicTechColors.voidSilver,
    marginTop: 2,
  },
  resourcesContainer: {
    flexDirection: 'column',
    gap: 4, // Smaller gap for mobile
    minWidth: 60,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceValue: {
    fontSize: 11, // Smaller for mobile
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
    top: 10, // Smaller top margin for mobile
    left: 12, // Smaller left margin for mobile
    zIndex: 2,
  },
  zoneText: {
    fontSize: 14, // Smaller for mobile
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
  },
  killsText: {
    fontSize: 11, // Smaller for mobile
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
    paddingBottom: 8, // Extra padding for iPhone home indicator
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Increased for better touch targets
    paddingHorizontal: 4,
    pointerEvents: 'auto',
    minHeight: 60, // Ensure minimum 44pt touch target
  },
  navButtonActive: {
    backgroundColor: MythicTechColors.neonBlue + '22',
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 9, // Smaller for mobile
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
    bottom: MOBILE_BOTTOM_NAV_HEIGHT, // Account for mobile bottom nav
    zIndex: 500,
    pointerEvents: 'box-none', // Allow touches to pass through to background
  },
});