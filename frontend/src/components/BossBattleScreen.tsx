import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCombat } from '../contexts/CombatContext';
import { useBoss } from '../contexts/BossContext';
import { useGame } from '../contexts/GameContext';
import { Boss, BossType, BossTier } from '../data/BossData';
import { CombatEnemy } from '../engine/CombatEngine';

interface BossBattleScreenProps {
  visible: boolean;
  boss: Boss;
  tier: BossTier;
  onComplete: (victory: boolean) => void;
  onEscape: () => void;
}

export const BossBattleScreen: React.FC<BossBattleScreenProps> = ({
  visible,
  boss,
  tier,
  onComplete,
  onEscape
}) => {
  const { gameState, updateNinja } = useGame();
  const { combatState, spawnBoss, clearAllEnemies } = useCombat();
  const [battlePhase, setBattlePhase] = useState<'countdown' | 'combat' | 'respawning' | 'victory' | 'defeat'>('countdown');
  const [countdown, setCountdown] = useState(10);
  const [bossSpawned, setBossSpawned] = useState(false);
  const [playerLives, setPlayerLives] = useState(3);
  const [respawnTimer, setRespawnTimer] = useState(5);
  const [bossAttacks, setBossAttacks] = useState<BossAttack[]>([]);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat'>('victory');
  
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const screenAnim = useRef(new Animated.Value(0)).current;
  const respawnAnim = useRef(new Animated.Value(1)).current;

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 100; // Leave space for UI

  // Boss attack animation interface
  interface BossAttack {
    id: string;
    type: string;
    element: string;
    position: { x: number; y: number };
    startTime: number;
    duration: number;
  }

  // Initialize boss battle when visible
  useEffect(() => {
    if (visible) {
      setBattlePhase('countdown');
      setCountdown(10);
      setBossSpawned(false);
      clearAllEnemies();
      
      // Screen entrance animation
      Animated.timing(screenAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      startCountdown();
    } else {
      // Reset when not visible
      setBattlePhase('countdown');
      setBossSpawned(false);
      screenAnim.setValue(0);
    }
  }, [visible]);

  // Monitor boss health for victory condition
  useEffect(() => {
    if (battlePhase === 'combat' && bossSpawned) {
      const bossEnemy = combatState.enemies.find(enemy => enemy.name.includes(tier.name));
      if (bossEnemy && bossEnemy.health <= 0) {
        handleBossDefeat();
      }
    }
  }, [combatState.enemies, battlePhase, bossSpawned]);

  // Monitor player health for defeat condition  
  useEffect(() => {
    if (battlePhase === 'combat' && gameState.ninja.health <= 0) {
      handlePlayerDefeat();
    }
  }, [gameState.ninja.health, battlePhase]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          spawnBossEnemy();
          return 0;
        }
        
        // Countdown animation
        Animated.sequence([
          Animated.timing(countdownAnim, {
            toValue: 1.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(countdownAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
        
        return prev - 1;
      });
    }, 1000);
  };

  const spawnBossEnemy = () => {
    setBattlePhase('combat');
    setBossSpawned(true);

    // Create boss enemy with enhanced stats
    const bossEnemy: CombatEnemy = {
      id: `boss_${boss.id}_${tier.tier}`,
      name: `${tier.name}`,
      health: tier.stats.hp,
      maxHealth: tier.stats.hp,
      stats: {
        attack: tier.stats.attack,
        defense: tier.stats.defense,
        critChance: tier.stats.critChance,
        cooldownReduction: 0
      },
      position: {
        x: SCREEN_WIDTH * 0.75, // Spawn on right side
        y: GAME_AREA_HEIGHT * 0.5
      },
      lastDamaged: 0,
      abilities: tier.stats.abilities, // Boss special abilities
      isBoss: true, // Mark as boss for special rendering/behavior
      element: boss.element.toLowerCase() as 'fire' | 'ice' | 'shadow' | 'earth'
    };

    // Spawn the boss using combat context
    spawnBoss(bossEnemy);
    
    console.log(`🐉 Boss spawned: ${tier.name} (${tier.stats.hp} HP, ${tier.stats.attack} ATK)`);
  };

  const handleBossDefeat = () => {
    setBattlePhase('victory');
    console.log('🏆 Boss defeated!');
    
    // Delay before completing battle
    setTimeout(() => {
      onComplete(true);
    }, 2000);
  };

  const handlePlayerDefeat = () => {
    setBattlePhase('defeat');
    console.log('💀 Player defeated by boss!');
    
    // Delay before completing battle  
    setTimeout(() => {
      onComplete(false);
    }, 2000);
  };

  const handleEscape = () => {
    clearAllEnemies();
    setBattlePhase('countdown');
    onEscape();
  };

  const renderCountdown = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.bossTitle}>{tier.name}</Text>
      <Text style={styles.bossSubtitle}>{boss.name} • {boss.location}</Text>
      
      <View style={styles.countdownCircle}>
        <Animated.Text
          style={[
            styles.countdownNumber,
            {
              transform: [{ scale: countdownAnim }],
              color: countdown <= 3 ? '#ef4444' : '#10b981'
            }
          ]}
        >
          {countdown}
        </Animated.Text>
      </View>
      
      <Text style={styles.countdownLabel}>
        {countdown > 0 ? 'Boss arrives in...' : 'BOSS BATTLE!'}
      </Text>

      <View style={styles.bossStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={20} color="#ef4444" />
          <Text style={styles.statText}>{tier.stats.hp.toLocaleString()} HP</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={20} color="#f59e0b" />
          <Text style={styles.statText}>{tier.stats.attack} ATK</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="shield" size={20} color="#3b82f6" />
          <Text style={styles.statText}>{tier.stats.defense} DEF</Text>
        </View>
      </View>

      <View style={styles.abilitiesContainer}>
        <Text style={styles.abilitiesTitle}>Boss Abilities:</Text>
        <Text style={styles.abilitiesText}>{tier.stats.abilities.join(' • ')}</Text>
      </View>
    </View>
  );

  const renderCombat = () => (
    <View style={styles.combatContainer}>
      <View style={styles.battleHeader}>
        <Text style={styles.battleTitle}>⚔️ {tier.name}</Text>
        <TouchableOpacity onPress={handleEscape} style={styles.escapeButton}>
          <Ionicons name="exit-outline" size={20} color="#ef4444" />
          <Text style={styles.escapeText}>Escape</Text>
        </TouchableOpacity>
      </View>

      {/* Boss Health Bar */}
      {combatState.enemies.length > 0 && (
        <View style={styles.bossHealthContainer}>
          {combatState.enemies.filter(enemy => enemy.isBoss).map(bossEnemy => (
            <View key={bossEnemy.id} style={styles.bossHealthBar}>
              <Text style={styles.bossHealthLabel}>{bossEnemy.name}</Text>
              <View style={styles.healthBarContainer}>
                <View 
                  style={[
                    styles.healthBarFill, 
                    { 
                      width: `${(bossEnemy.health / bossEnemy.maxHealth) * 100}%`,
                      backgroundColor: bossEnemy.health > bossEnemy.maxHealth * 0.5 ? '#10b981' :
                                     bossEnemy.health > bossEnemy.maxHealth * 0.2 ? '#f59e0b' : '#ef4444'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.bossHealthText}>
                {bossEnemy.health.toLocaleString()}/{bossEnemy.maxHealth.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Combat Arena - the actual combat UI will render here via the main game's combat system */}
      <View style={styles.combatArena}>
        <Text style={styles.arenaLabel}>⚔️ BOSS BATTLE IN PROGRESS ⚔️</Text>
        <Text style={styles.arenaSubtext}>Use your abilities to defeat the boss!</Text>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={styles.resultContainer}>
      {battlePhase === 'victory' ? (
        <>
          <Ionicons name="trophy" size={80} color="#f59e0b" />
          <Text style={styles.resultTitle}>🏆 VICTORY!</Text>
          <Text style={styles.resultText}>You defeated {tier.name}!</Text>
          <Text style={styles.resultSubtext}>Returning to zone...</Text>
        </>
      ) : (
        <>
          <Ionicons name="skull" size={80} color="#ef4444" />
          <Text style={styles.resultTitle}>💀 DEFEAT</Text>
          <Text style={styles.resultText}>{tier.name} was too powerful!</Text>
          <Text style={styles.resultSubtext}>Try again when stronger...</Text>
        </>
      )}
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: screenAnim,
          transform: [
            {
              scale: screenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }
          ]
        }
      ]}
    >
      {/* Boss Battle Background */}
      <View style={[styles.background, { backgroundColor: getBossThemeColor(boss.element) }]}>
        <Text style={styles.backgroundPattern}>{getBossPattern(boss.element)}</Text>
      </View>

      {/* Battle UI */}
      {battlePhase === 'countdown' && renderCountdown()}
      {battlePhase === 'combat' && renderCombat()}
      {(battlePhase === 'victory' || battlePhase === 'defeat') && renderResult()}
    </Animated.View>
  );
};

// Helper functions for boss theming
const getBossThemeColor = (element: string): string => {
  switch (element.toLowerCase()) {
    case 'fire': return '#dc2626';
    case 'ice': return '#2563eb'; 
    case 'shadow': return '#1f2937';
    case 'earth': return '#65a30d';
    default: return '#374151';
  }
};

const getBossPattern = (element: string): string => {
  switch (element.toLowerCase()) {
    case 'fire': return '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥';
    case 'ice': return '❄️❄️❄️❄️❄️❄️❄️❄️❄️❄️';
    case 'shadow': return '🌑🌑🌑🌑🌑🌑🌑🌑🌑🌑';
    case 'earth': return '⛰️⛰️⛰️⛰️⛰️⛰️⛰️⛰️⛰️⛰️';
    default: return '⚔️⚔️⚔️⚔️⚔️⚔️⚔️⚔️⚔️⚔️';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000, // Above everything else
    pointerEvents: 'auto',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 30,
    opacity: 0.1,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bossTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  bossSubtitle: {
    fontSize: 18,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countdownLabel: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  bossStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  statText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  abilitiesContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
    width: '90%',
  },
  abilitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
    textAlign: 'center',
  },
  abilitiesText: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 20,
  },
  combatContainer: {
    flex: 1,
    padding: 16,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  battleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  escapeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  escapeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bossHealthContainer: {
    marginBottom: 20,
  },
  bossHealthBar: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  bossHealthLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  healthBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  bossHealthText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  combatArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 20,
  },
  arenaLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 8,
  },
  arenaSubtext: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
    opacity: 0.8,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 20,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});