import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 200;
const NINJA_SIZE = 40;
const ENEMY_SIZE = 35;

interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'goblin' | 'orc' | 'skeleton' | 'boss';
  damage: number;
  reward: { gold: number; exp: number };
  speed: number;
}

interface GameState {
  ninjaPosition: { x: number; y: number };
  enemies: Enemy[];
  isAutoFighting: boolean;
  currentStage: number;
  killCount: number;
}

export default function GameScreen() {
  const { gameState, updateNinja } = useGame();
  const { ninja } = gameState;
  
  const [localGameState, setLocalGameState] = useState<GameState>({
    ninjaPosition: { x: SCREEN_WIDTH / 2, y: GAME_AREA_HEIGHT / 2 },
    enemies: [],
    isAutoFighting: true, // Start auto-fighting by default
    currentStage: 1,
    killCount: 0,
  });

  const ninjaAnimatedPosition = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH / 2 - NINJA_SIZE / 2,
    y: GAME_AREA_HEIGHT / 2 - NINJA_SIZE / 2
  })).current;
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const spawnTimerRef = useRef<NodeJS.Timeout>();

  // Enemy types with different stats based on stage
  const getEnemyStats = (type: Enemy['type'], stage: number) => {
    const baseStats = {
      goblin: { health: 50, damage: 8, gold: 5, exp: 3, speed: 1 },
      orc: { health: 120, damage: 15, gold: 12, exp: 8, speed: 0.8 },
      skeleton: { health: 80, damage: 12, gold: 8, exp: 5, speed: 1.2 },
      boss: { health: 500, damage: 25, gold: 100, exp: 50, speed: 0.5 },
    };
    
    const stats = baseStats[type];
    const multiplier = 1 + (stage - 1) * 0.3;
    
    return {
      health: Math.floor(stats.health * multiplier),
      maxHealth: Math.floor(stats.health * multiplier),
      damage: Math.floor(stats.damage * multiplier),
      reward: {
        gold: Math.floor(stats.gold * multiplier),
        exp: Math.floor(stats.exp * multiplier),
      },
      speed: stats.speed,
    };
  };

  // Spawn enemy at random position
  const spawnEnemy = () => {
    const enemyTypes: Enemy['type'][] = ['goblin', 'orc', 'skeleton'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Spawn boss every 50 kills
    const type = localGameState.killCount > 0 && localGameState.killCount % 50 === 0 && 
                 !localGameState.enemies.some(e => e.type === 'boss') ? 'boss' : randomType;
    
    const stats = getEnemyStats(type, localGameState.currentStage);
    
    const enemy: Enemy = {
      id: Date.now().toString() + Math.random(),
      x: Math.random() * (SCREEN_WIDTH - ENEMY_SIZE),
      y: Math.random() * (GAME_AREA_HEIGHT - ENEMY_SIZE - 100) + 50,
      type,
      ...stats,
    };

    setLocalGameState(prev => ({
      ...prev,
      enemies: [...prev.enemies, enemy],
    }));
  };

  // Auto-spawn enemies to maintain target count
  const autoSpawnEnemies = () => {
    const targetEnemyCount = 10; // Reduced from 20 to 10
    const currentCount = localGameState.enemies.length;
    
    if (currentCount < targetEnemyCount) {
      const enemiesToSpawn = Math.min(3, targetEnemyCount - currentCount); // Spawn up to 3 at once
      for (let i = 0; i < enemiesToSpawn; i++) {
        setTimeout(() => spawnEnemy(), i * 100); // Stagger spawning slightly
      }
    }
  };

  // Move ninja towards target position with smooth animation
  const moveNinja = (targetX: number, targetY: number) => {
    const newX = Math.max(NINJA_SIZE / 2, Math.min(SCREEN_WIDTH - NINJA_SIZE / 2, targetX));
    const newY = Math.max(NINJA_SIZE / 2, Math.min(GAME_AREA_HEIGHT - NINJA_SIZE / 2, targetY));
    
    // Calculate distance for animation duration
    const currentAnimatedX = ninjaAnimatedPosition.x._value + NINJA_SIZE / 2;
    const currentAnimatedY = ninjaAnimatedPosition.y._value + NINJA_SIZE / 2;
    const distance = Math.sqrt(Math.pow(newX - currentAnimatedX, 2) + Math.pow(newY - currentAnimatedY, 2));
    const duration = Math.min(1500, Math.max(300, distance * 4)); // Scale duration with distance

    // Smooth animation to new position
    Animated.timing(ninjaAnimatedPosition, {
      toValue: { x: newX - NINJA_SIZE / 2, y: newY - NINJA_SIZE / 2 },
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      // Update state position only after animation completes for collision detection
      setLocalGameState(prev => ({
        ...prev,
        ninjaPosition: { x: newX, y: newY },
      }));
    });
  };

  // Calculate distance between two points
  const getDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  // Auto-move ninja towards nearest enemy with smoother movement
  const autoMoveToEnemy = () => {
    if (!localGameState.isAutoFighting || localGameState.enemies.length === 0) return;

    const nearestEnemy = localGameState.enemies.reduce((nearest, enemy) => {
      const distToEnemy = getDistance(localGameState.ninjaPosition, { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 });
      const distToNearest = getDistance(localGameState.ninjaPosition, { x: nearest.x + ENEMY_SIZE / 2, y: nearest.y + ENEMY_SIZE / 2 });
      return distToEnemy < distToNearest ? enemy : nearest;
    });

    const targetX = nearestEnemy.x + ENEMY_SIZE / 2;
    const targetY = nearestEnemy.y + ENEMY_SIZE / 2;
    
    // Only move if not already very close to target
    const distance = getDistance(localGameState.ninjaPosition, { x: targetX, y: targetY });
    if (distance > 50) { // Only move if farther than attack range
      moveNinja(targetX, targetY);
    }
  };

  // Combat system
  const attackNearbyEnemies = () => {
    const attackRange = 60;
    const ninjaAttack = ninja.attack + (gameState.shurikens.find(s => s.equipped)?.attack || 0);
    
    setLocalGameState(prev => {
      const updatedEnemies = prev.enemies.map(enemy => {
        const distance = getDistance(prev.ninjaPosition, { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 });
        
        if (distance <= attackRange) {
          const damage = Math.max(1, ninjaAttack - Math.floor(Math.random() * 5));
          return { ...enemy, health: enemy.health - damage };
        }
        return enemy;
      });

      // Remove dead enemies and give rewards
      const aliveEnemies = updatedEnemies.filter(enemy => {
        if (enemy.health <= 0) {
          // Give rewards
          updateNinja({
            gold: ninja.gold + enemy.reward.gold,
            experience: ninja.experience + enemy.reward.exp,
          });
          return false;
        }
        return true;
      });

      const killedCount = updatedEnemies.length - aliveEnemies.length;
      
      return {
        ...prev,
        enemies: aliveEnemies,
        killCount: prev.killCount + killedCount,
      };
    });
  };

  // Enemy AI - move towards ninja and attack
  const updateEnemyAI = () => {
    setLocalGameState(prev => {
      const updatedEnemies = prev.enemies.map(enemy => {
        const distance = getDistance(prev.ninjaPosition, { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 });
        
        // Move towards ninja if not in attack range
        if (distance > 50) {
          const angle = Math.atan2(
            prev.ninjaPosition.y - (enemy.y + ENEMY_SIZE / 2),
            prev.ninjaPosition.x - (enemy.x + ENEMY_SIZE / 2)
          );
          
          return {
            ...enemy,
            x: enemy.x + Math.cos(angle) * enemy.speed,
            y: enemy.y + Math.sin(angle) * enemy.speed,
          };
        }
        
        // Attack ninja if in range
        if (distance <= 50) {
          const damage = Math.max(1, enemy.damage - ninja.defense);
          updateNinja({
            health: Math.max(1, ninja.health - damage),
          });
        }
        
        return enemy;
      });

      return { ...prev, enemies: updatedEnemies };
    });
  };

  // Main game loop
  useEffect(() => {
    // Always run the game loop, but auto-fighting controls behavior
    gameLoopRef.current = setInterval(() => {
      attackNearbyEnemies();
      updateEnemyAI();
      autoSpawnEnemies(); // Always spawn enemies to maintain count
    }, 200); // Faster game loop (200ms instead of 500ms)

    // Separate timer for smoother auto-movement
    spawnTimerRef.current = setInterval(() => {
      if (localGameState.isAutoFighting) {
        autoMoveToEnemy();
      }
    }, 800); // Less frequent movement for smoother animation

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [localGameState.isAutoFighting, localGameState.enemies.length, localGameState.ninjaPosition]);

  // Initial enemy spawn on game start
  useEffect(() => {
    // Spawn initial batch of enemies when game starts
    const initialSpawnTimer = setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => spawnEnemy(), i * 200);
      }
    }, 1000);

    return () => clearTimeout(initialSpawnTimer);
  }, []);

  // Level progression
  useEffect(() => {
    const newStage = Math.floor(localGameState.killCount / 50) + 1;
    if (newStage > localGameState.currentStage) {
      setLocalGameState(prev => ({ ...prev, currentStage: newStage }));
      Alert.alert('Stage Complete!', `Welcome to Stage ${newStage}! Enemies are now stronger!`);
    }
  }, [localGameState.killCount]);

  // Handle manual ninja movement
  const handleTapMovement = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    moveNinja(locationX, locationY);
  };

  const toggleAutoFight = () => {
    setLocalGameState(prev => ({
      ...prev,
      isAutoFighting: !prev.isAutoFighting,
    }));
  };

  const getEnemyIcon = (type: Enemy['type']) => {
    const icons = {
      goblin: 'bug',
      orc: 'skull',
      skeleton: 'body',
      boss: 'flame',
    };
    return icons[type] as keyof typeof Ionicons.glyphMap;
  };

  const getEnemyColor = (type: Enemy['type']) => {
    const colors = {
      goblin: '#10b981',
      orc: '#ef4444',
      skeleton: '#8b5cf6',
      boss: '#f59e0b',
    };
    return colors[type];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Battle Arena</Text>
        <View style={styles.headerRight}>
          <Text style={styles.stageText}>Stage {localGameState.currentStage}</Text>
        </View>
      </View>

      {/* Game Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>HP</Text>
          <Text style={styles.statValue}>{ninja.health}/{ninja.maxHealth}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Kills</Text>
          <Text style={styles.statValue}>{localGameState.killCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Gold</Text>
          <Text style={styles.statValue}>{ninja.gold}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View 
        style={styles.gameArea}
        onTouchEnd={handleTapMovement}
      >
        {/* Ninja Character */}
        <Animated.View
          style={[
            styles.ninja,
            {
              left: ninjaAnimatedPosition.x,
              top: ninjaAnimatedPosition.y,
            },
          ]}
        >
          <Ionicons name="person" size={30} color="#8b5cf6" />
        </Animated.View>

        {/* Enemies */}
        {localGameState.enemies.map(enemy => (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                left: enemy.x,
                top: enemy.y,
                backgroundColor: getEnemyColor(enemy.type),
              },
            ]}
          >
            <Ionicons name={getEnemyIcon(enemy.type)} size={25} color="#ffffff" />
            
            {/* Enemy Health Bar */}
            <View style={styles.enemyHealthBar}>
              <View 
                style={[
                  styles.enemyHealthFill,
                  { width: `${(enemy.health / enemy.maxHealth) * 100}%` }
                ]}
              />
            </View>
          </View>
        ))}

        {/* Attack Range Indicator */}
        <View
          style={[
            styles.attackRange,
            {
              left: localGameState.ninjaPosition.x - 30,
              top: localGameState.ninjaPosition.y - 30,
            },
          ]}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            localGameState.isAutoFighting && styles.activeButton,
          ]}
          onPress={toggleAutoFight}
        >
          <Ionicons 
            name={localGameState.isAutoFighting ? "pause" : "play"} 
            size={24} 
            color="#ffffff" 
          />
          <Text style={styles.controlButtonText}>
            {localGameState.isAutoFighting ? 'Manual' : 'Auto'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (ninja.gems >= 5) {
              updateNinja({
                health: ninja.maxHealth,
                gems: ninja.gems - 5,
              });
              Alert.alert('Healed!', 'Your ninja has been fully healed!');
            } else {
              Alert.alert('Not enough gems!', 'You need 5 gems to heal.');
            }
          }}
        >
          <Ionicons name="medical" size={24} color="#ffffff" />
          <Text style={styles.controlButtonText}>Heal</Text>
        </TouchableOpacity>

        <View style={styles.controlButton}>
          <Ionicons name="people" size={24} color="#ffffff" />
          <Text style={styles.controlButtonText}>Enemies: {localGameState.enemies.length}/20</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  stageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#374151',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#1e293b',
    position: 'relative',
    overflow: 'hidden',
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
  enemyHealthBar: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#374151',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  controlButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  activeButton: {
    backgroundColor: '#8b5cf6',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});