import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCombat } from '../contexts/CombatContext';
import { useBoss } from '../contexts/BossContext';
import { useGame } from '../contexts/GameContext';
import { Boss, BossType, BossTier } from '../data/BossData';
import { CombatEnemy } from '../engine/CombatEngine';

// Boss attack animation interface
interface BossAttack {
  id: string;
  type: string;
  element: string;
  position: { x: number; y: number };
  startTime: number;
  duration: number;
}

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
  const [countdown, setCountdown] = useState(5);
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

  // Initialize boss battle when visible
  useEffect(() => {
    if (visible) {
      setBattlePhase('countdown');
      setCountdown(5);
      setBossSpawned(false);
      setPlayerLives(3);
      setRespawnTimer(5);
      setBossAttacks([]);
      setShowResultPopup(false);
      clearAllEnemies();
      
      // Reset player health to full
      updateNinja(prev => ({
        health: prev.maxHealth || 100
      }));
      
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
      setPlayerLives(3);
      setBossAttacks([]);
      setShowResultPopup(false);
      screenAnim.setValue(0);
    }
  }, [visible]);

  // Monitor boss health for victory condition
  useEffect(() => {
    if (battlePhase === 'combat' && bossSpawned && !showResultPopup) {
      const bossEnemy = combatState.enemies.find(enemy => enemy.isBoss);
      if (bossEnemy && bossEnemy.health <= 0) {
        handleBossDefeated();
      }
    }
  }, [combatState.enemies, battlePhase, bossSpawned, showResultPopup]);

  // Monitor player health for lives system
  useEffect(() => {
    if (battlePhase === 'combat' && playerLives > 0 && !showResultPopup) {
      const playerHealth = gameState.ninja.health || 0;
      if (playerHealth <= 0) {
        handlePlayerDeath();
      }
    }
  }, [gameState.ninja.health, battlePhase, playerLives, showResultPopup]);

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
    
    // Start boss attack patterns
    startBossAttackPattern();
    
    console.log(`🐉 Boss spawned: ${tier.name} (${tier.stats.hp} HP, ${tier.stats.attack} ATK)`);
  };

  const handleBossDefeated = () => {
    setBattleResult('victory');
    setShowResultPopup(true);
    clearAllEnemies();
    console.log('🏆 Boss defeated!');
  };

  const handlePlayerDeath = () => {
    setPlayerLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        // Game over - player lost all lives
        setBattleResult('defeat');
        setShowResultPopup(true);
        clearAllEnemies();
        console.log('💀 Player defeated by boss - all lives lost!');
        return 0;
      } else {
        // Player still has lives - start respawn timer
        setBattlePhase('respawning');
        setRespawnTimer(5);
        startRespawnCountdown();
        console.log(`💀 Player died! ${newLives} lives remaining`);
        return newLives;
      }
    });
  };

  const startRespawnCountdown = () => {
    const timer = setInterval(() => {
      setRespawnTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          respawnPlayer();
          return 0;
        }
        
        // Respawn animation
        Animated.sequence([
          Animated.timing(respawnAnim, {
            toValue: 1.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(respawnAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        return prev - 1;
      });
    }, 1000);
  };

  const respawnPlayer = () => {
    // Restore player health and return to combat
    updateNinja(prev => ({
      health: prev.maxHealth || 100
    }));
    setBattlePhase('combat');
    setRespawnTimer(5);
  };

  const startBossAttackPattern = () => {
    // Create periodic boss attacks with element-specific visuals
    const attackInterval = setInterval(() => {
      if (battlePhase === 'combat' && bossSpawned && !showResultPopup) {
        triggerBossAttack();
      } else {
        clearInterval(attackInterval);
      }
    }, 3000); // Boss attacks every 3 seconds
  };

  const triggerBossAttack = () => {
    const attackId = Date.now().toString();
    const abilities = tier.stats.abilities;
    const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
    
    const newAttack: BossAttack = {
      id: attackId,
      type: randomAbility,
      element: boss.element.toLowerCase(),
      position: {
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * (GAME_AREA_HEIGHT * 0.6) + (GAME_AREA_HEIGHT * 0.2)
      },
      startTime: Date.now(),
      duration: 2000 // Attack animation lasts 2 seconds
    };

    setBossAttacks(prev => [...prev, newAttack]);

    // Remove attack after duration
    setTimeout(() => {
      setBossAttacks(prev => prev.filter(attack => attack.id !== attackId));
    }, newAttack.duration);
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

      {/* Player Lives Display */}
      <View style={styles.livesContainer}>
        <Text style={styles.livesLabel}>Lives:</Text>
        {[1, 2, 3].map(life => (
          <Ionicons 
            key={life}
            name={life <= playerLives ? "heart" : "heart-outline"}
            size={24}
            color={life <= playerLives ? "#ef4444" : "#6b7280"}
          />
        ))}
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

      {/* Boss Attacks Overlay */}
      <View style={styles.attacksContainer}>
        {bossAttacks.map(attack => (
          <Animated.View
            key={attack.id}
            style={[
              styles.bossAttack,
              {
                left: attack.position.x,
                top: attack.position.y,
                backgroundColor: getAttackColor(attack.element),
              }
            ]}
          >
            <Text style={styles.attackText}>{getAttackEmoji(attack.type, attack.element)}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderRespawning = () => (
    <View style={styles.respawnContainer}>
      <Ionicons name="skull-outline" size={80} color="#ef4444" />
      <Text style={styles.respawnTitle}>You were defeated!</Text>
      <Text style={styles.respawnText}>Lives remaining: {playerLives}</Text>
      
      <View style={styles.respawnTimerContainer}>
        <Animated.Text
          style={[
            styles.respawnTimer,
            {
              transform: [{ scale: respawnAnim }],
              color: respawnTimer <= 2 ? '#ef4444' : '#f59e0b'
            }
          ]}
        >
          {respawnTimer}
        </Animated.Text>
      </View>
      
      <Text style={styles.respawnLabel}>Respawning in...</Text>
    </View>
  );

  const renderResult = () => (
    <View style={styles.resultContainer}>
      {battleResult === 'victory' ? (
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

  const renderResultPopup = () => (
    <Modal
      visible={showResultPopup}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popup}>
          {battleResult === 'victory' ? (
            <>
              <Ionicons name="trophy" size={100} color="#f59e0b" />
              <Text style={styles.popupTitle}>🎉 VICTORY! 🎉</Text>
              <Text style={styles.popupText}>
                You have defeated {tier.name}!
              </Text>
              <Text style={styles.popupSubtext}>
                Your skills as a ninja are unmatched!
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="skull" size={100} color="#ef4444" />
              <Text style={styles.popupTitle}>💀 DEFEAT 💀</Text>
              <Text style={styles.popupText}>
                {tier.name} has proven too powerful...
              </Text>
              <Text style={styles.popupSubtext}>
                Train harder and return when you're stronger!
              </Text>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.popupButton} 
            onPress={() => {
              setShowResultPopup(false);
              setTimeout(() => onComplete(battleResult === 'victory'), 500);
            }}
          >
            <Text style={styles.popupButtonText}>
              {battleResult === 'victory' ? 'Continue' : 'Return'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!visible) {
    return null;
  }

  return (
    <>
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
        {battlePhase === 'respawning' && renderRespawning()}
      </Animated.View>
      
      {/* Result Popup */}
      {renderResultPopup()}
    </>
  );
};

// Helper functions for boss theming and attacks
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

const getAttackColor = (element: string): string => {
  switch (element.toLowerCase()) {
    case 'fire': return 'rgba(239, 68, 68, 0.8)';
    case 'ice': return 'rgba(59, 130, 246, 0.8)';
    case 'shadow': return 'rgba(55, 65, 81, 0.8)';
    case 'earth': return 'rgba(101, 163, 13, 0.8)';
    default: return 'rgba(107, 114, 128, 0.8)';
  }
};

const getAttackEmoji = (attackType: string, element: string): string => {
  const elementEmoji = {
    fire: '🔥',
    ice: '❄️',
    shadow: '🌑',
    earth: '🪨'
  };
  
  const base = elementEmoji[element.toLowerCase() as keyof typeof elementEmoji] || '💥';
  
  switch (attackType.toLowerCase()) {
    case 'fire breath':
    case 'flame strike':
      return '🔥💨';
    case 'ice shard':
    case 'freeze':
      return '❄️🧊';
    case 'shadow strike':
    case 'stealth':
      return '🌑⚡';
    case 'rock throw':
    case 'earthquake':
      return '🪨💥';
    default:
      return `${base}⚡`;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 70, // Leave space for bottom tabs
    zIndex: 1500, // Below overlays but above game content
    pointerEvents: 'box-none', // Allow touches to pass through to combat area
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200, // Only cover top portion for atmospheric effect
    opacity: 0.7,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    opacity: 0.3,
  },
  // Countdown styles
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
  // Combat styles
  combatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    pointerEvents: 'box-none',
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    pointerEvents: 'auto',
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
  // Lives display
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    pointerEvents: 'auto',
  },
  livesLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Boss health
  bossHealthContainer: {
    marginBottom: 20,
    pointerEvents: 'auto',
  },
  bossHealthBar: {
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  // Attack animations
  attacksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  bossAttack: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  attackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Combat arena
  combatArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
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
    marginBottom: 8,
  },
  livesWarning: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Respawn screen
  respawnContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  respawnTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  respawnText: {
    fontSize: 18,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 30,
  },
  respawnTimerContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  respawnTimer: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  respawnLabel: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Result popup styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  popupText: {
    fontSize: 18,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  popupSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  popupButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Legacy result styles (kept for compatibility)
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