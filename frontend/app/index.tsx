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
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 140;
const NINJA_SIZE = 40;
const ENEMY_SIZE = 35;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'bosses' | 'zones' | 'equipment' | null;

export default function NinjaIdleGame() {
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

  // ALL useEffect hooks must be declared before returns
  useEffect(() => {
    if (gameState?.ninja && gameState.ninja.level > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', gameState.ninja.level);
      handleLevelUpExplosion();
      setPreviousLevel(gameState.ninja.level);
    }
  }, [gameState?.ninja?.level, previousLevel, handleLevelUpExplosion]);

  useEffect(() => {
    const moveNinja = () => {
      const now = Date.now();
      const deltaTime = now - lastMovementTime;
      
      if (deltaTime >= 16) {
        setNinjaPosition(prevPos => {
          if (!combatState.enemies || combatState.enemies.length === 0 || isAttacking) {
            return prevPos;
          }
          
          let closestEnemy = null;
          let closestDistance = Infinity;
          
          combatState.enemies.forEach(enemy => {
            if (!enemy?.position) return; // Skip enemies without position
            
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
          
          const ATTACK_RANGE = 40;
          if (closestDistance <= ATTACK_RANGE) {
            return prevPos;
          }
          
          const targetX = closestEnemy.position.x + ENEMY_SIZE / 2 - NINJA_SIZE / 2;
          const targetY = closestEnemy.position.y + ENEMY_SIZE / 2 - NINJA_SIZE / 2;
          
          const directionX = targetX - prevPos.x;
          const directionY = targetY - prevPos.y;
          const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
          
          if (magnitude === 0) return prevPos;
          
          const normalizedX = directionX / magnitude;
          const normalizedY = directionY / magnitude;
          
          const NINJA_SPEED = 2;
          const newX = Math.max(0, Math.min(SCREEN_WIDTH - NINJA_SIZE, prevPos.x + normalizedX * NINJA_SPEED));
          const newY = Math.max(0, Math.min(GAME_AREA_HEIGHT - NINJA_SIZE, prevPos.y + normalizedY * NINJA_SPEED));
          
          updateNinjaPosition({ x: newX + NINJA_SIZE / 2, y: newY + NINJA_SIZE / 2 });
          
          return { x: newX, y: newY };
        });
        
        setLastMovementTime(now);
      }
    };

    const interval = setInterval(moveNinja, 16);
    return () => clearInterval(interval);
  }, [combatState.enemies, isAttacking, lastMovementTime, updateNinjaPosition]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('💀 Enemy defeated!') && !message.includes('Boss defeated')) {
        const killsMatch = message.match(/Kill (\d+)/);
        if (killsMatch) {
          const killNumber = parseInt(killsMatch[1]);
          if (killNumber > lastProcessedKill) {
            setTotalKills(killNumber);
            setLastProcessedKill(killNumber);
            recordEnemyKill();
          }
        }
      }
      
      if (message.includes('👊 Ninja attacks enemy!')) {
        const now = Date.now();
        if (now - lastAttackTime > 100) {
          setIsAttacking(true);
          setLastAttackTime(now);
          setTimeout(() => setIsAttacking(false), 300);
        }
      }
      
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, [lastProcessedKill, recordEnemyKill, lastAttackTime]);

  useEffect(() => {
    console.log('🎮 Main component calling startCombat...');
    startCombat();
    
    return () => {
      console.log('🛑 Main component cleanup - calling stopCombat...');
      stopCombat();
    };
  }, [startCombat, stopCombat]);
  
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
  
  const ninja = gameState?.ninja;
  
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
        {combatState.enemies?.map(enemy => (
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
        {projectiles?.map(projectile => (
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
    height: 80,
    backgroundColor: MythicTechColors.deepVoid,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: MythicTechColors.neonBlue + '44',
  },
  progressSection: {
    flex: 1,
  },
  progressionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: MythicTechColors.cosmicGold,
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
    minWidth: 70,
  },
  xpContainer: {
    flex: 1,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: MythicTechColors.voidSilver + '33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: MythicTechColors.neonBlue,
    borderRadius: 4,
  },
  xpText: {
    fontSize: 10,
    color: MythicTechColors.voidSilver,
    marginTop: 2,
  },
  resourcesContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: MythicTechColors.white,
    minWidth: 40,
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
    top: 60,
    left: 16,
    zIndex: 2,
  },
  zoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
  },
  killsText: {
    fontSize: 12,
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
    height: 80,
    backgroundColor: MythicTechColors.deepVoid,
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: MythicTechColors.neonBlue + '44',
    zIndex: 1000,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    pointerEvents: 'auto',
  },
  navButtonActive: {
    backgroundColor: MythicTechColors.neonBlue + '22',
  },
  navButtonText: {
    fontSize: 10,
    color: MythicTechColors.voidSilver,
    marginTop: 2,
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
    bottom: 80,
    zIndex: 500,
    pointerEvents: 'none',
  },
});