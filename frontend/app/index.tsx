import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import ShurikensOverlay from '../src/components/ShurikensOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import TrainingOverlay from '../src/components/TrainingOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 250; // Leave space for bottom tabs
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

type ActiveOverlay = 'stats' | 'shurikens' | 'pets' | 'training' | 'raids' | 'adventure' | null;

export default function NinjaIdleGame() {
  const { gameState, updateNinja } = useGame();
  const { ninja } = gameState;
  
  const [localGameState, setLocalGameState] = useState<GameState>({
    ninjaPosition: { x: SCREEN_WIDTH / 2, y: GAME_AREA_HEIGHT / 2 },
    enemies: [],
    isAutoFighting: true,
    currentStage: 1,
    killCount: 0,
  });

  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);

  const ninjaAnimatedPosition = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH / 2 - NINJA_SIZE / 2,
    y: GAME_AREA_HEIGHT / 2 - NINJA_SIZE / 2
  })).current;

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const spawnTimerRef = useRef<NodeJS.Timeout>();

  // Enemy stats based on stage
  const getEnemyStats = (type: Enemy['type'], stage: number) => {
    const baseStats = {
      goblin: { health: 50, damage: 8, gold: 5, exp: 10, speed: 1 },
      orc: { health: 120, damage: 15, gold: 12, exp: 20, speed: 0.8 },
      skeleton: { health: 80, damage: 12, gold: 8, exp: 15, speed: 1.2 },
      boss: { health: 500, damage: 25, gold: 100, exp: 200, speed: 0.5 },
    };
    
    const stats = baseStats[type];
    const multiplier = 1 + (stage - 1) * 0.3;
    
    return {
      health: Math.floor(stats.health * multiplier),
      maxHealth: Math.floor(stats.health * multiplier),
      damage: Math.floor(stats.damage * multiplier),
      reward: {
        gold: Math.floor(stats.gold * multiplier),
        exp: Math.floor(stats.exp * multiplier), // Increased base EXP rewards
      },
      speed: stats.speed,
    };
  };

  // Spawn enemy
  const spawnEnemy = () => {
    const enemyTypes: Enemy['type'][] = ['goblin', 'orc', 'skeleton'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
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

  // Auto-spawn enemies
  const autoSpawnEnemies = () => {
    const targetEnemyCount = 10;
    const currentCount = localGameState.enemies.length;
    
    if (currentCount < targetEnemyCount) {
      const enemiesToSpawn = Math.min(3, targetEnemyCount - currentCount);
      for (let i = 0; i < enemiesToSpawn; i++) {
        setTimeout(() => spawnEnemy(), i * 100);
      }
    }
  };

  // Move ninja with smooth animation
  const moveNinja = (targetX: number, targetY: number) => {
    const newX = Math.max(NINJA_SIZE / 2, Math.min(SCREEN_WIDTH - NINJA_SIZE / 2, targetX));
    const newY = Math.max(NINJA_SIZE / 2, Math.min(GAME_AREA_HEIGHT - NINJA_SIZE / 2, targetY));
    
    const currentAnimatedX = ninjaAnimatedPosition.x._value + NINJA_SIZE / 2;
    const currentAnimatedY = ninjaAnimatedPosition.y._value + NINJA_SIZE / 2;
    const distance = Math.sqrt(Math.pow(newX - currentAnimatedX, 2) + Math.pow(newY - currentAnimatedY, 2));
    const duration = Math.min(1500, Math.max(300, distance * 4));

    Animated.timing(ninjaAnimatedPosition, {
      toValue: { x: newX - NINJA_SIZE / 2, y: newY - NINJA_SIZE / 2 },
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      setLocalGameState(prev => ({
        ...prev,
        ninjaPosition: { x: newX, y: newY },
      }));
    });
  };

  // Distance calculation
  const getDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  // Auto-move to enemies
  const autoMoveToEnemy = () => {
    if (!localGameState.isAutoFighting || localGameState.enemies.length === 0) return;

    const currentNinjaX = ninjaAnimatedPosition.x._value + NINJA_SIZE / 2;
    const currentNinjaY = ninjaAnimatedPosition.y._value + NINJA_SIZE / 2;

    const nearestEnemy = localGameState.enemies.reduce((nearest, enemy) => {
      const distToEnemy = getDistance({ x: currentNinjaX, y: currentNinjaY }, { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 });
      const distToNearest = getDistance({ x: currentNinjaX, y: currentNinjaY }, { x: nearest.x + ENEMY_SIZE / 2, y: nearest.y + ENEMY_SIZE / 2 });
      return distToEnemy < distToNearest ? enemy : nearest;
    });

    const targetX = nearestEnemy.x + ENEMY_SIZE / 2;
    const targetY = nearestEnemy.y + ENEMY_SIZE / 2;
    const distance = getDistance({ x: currentNinjaX, y: currentNinjaY }, { x: targetX, y: targetY });
    
    if (distance > 50) {
      moveNinja(targetX, targetY);
    }
  };

  // Combat system
  const attackNearbyEnemies = () => {
    const attackRange = 60;
    const ninjaAttack = ninja.attack + (gameState.shurikens.find(s => s.equipped)?.attack || 0);
    const currentNinjaX = ninjaAnimatedPosition.x._value + NINJA_SIZE / 2;
    const currentNinjaY = ninjaAnimatedPosition.y._value + NINJA_SIZE / 2;
    
    let totalGoldReward = 0;
    let totalExpReward = 0;
    
    setLocalGameState(prev => {
      const updatedEnemies = prev.enemies.map(enemy => {
        const distance = getDistance(
          { x: currentNinjaX, y: currentNinjaY }, 
          { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 }
        );
        
        if (distance <= attackRange) {
          const damage = Math.max(1, ninjaAttack - Math.floor(Math.random() * 5));
          return { ...enemy, health: enemy.health - damage };
        }
        return enemy;
      });

      const aliveEnemies = updatedEnemies.filter(enemy => {
        if (enemy.health <= 0) {
          totalGoldReward += enemy.reward.gold;
          totalExpReward += enemy.reward.exp;
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
    
    // Update ninja stats outside of setState
    if (totalGoldReward > 0 || totalExpReward > 0) {
      updateNinja({
        gold: ninja.gold + totalGoldReward,
        experience: ninja.experience + totalExpReward,
      });
    }
  };

  // Enemy AI
  const updateEnemyAI = () => {
    const currentNinjaX = ninjaAnimatedPosition.x._value + NINJA_SIZE / 2;
    const currentNinjaY = ninjaAnimatedPosition.y._value + NINJA_SIZE / 2;

    setLocalGameState(prev => {
      const updatedEnemies = prev.enemies.map(enemy => {
        const distance = getDistance({ x: currentNinjaX, y: currentNinjaY }, { x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2 });
        
        if (distance > 50) {
          const angle = Math.atan2(
            currentNinjaY - (enemy.y + ENEMY_SIZE / 2),
            currentNinjaX - (enemy.x + ENEMY_SIZE / 2)
          );
          
          return {
            ...enemy,
            x: enemy.x + Math.cos(angle) * enemy.speed,
            y: enemy.y + Math.sin(angle) * enemy.speed,
          };
        }
        
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

  // Game loop
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      attackNearbyEnemies();
      updateEnemyAI();
      autoSpawnEnemies();
    }, 200);

    spawnTimerRef.current = setInterval(() => {
      if (localGameState.isAutoFighting) {
        autoMoveToEnemy();
      }
    }, 800);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [localGameState.isAutoFighting, localGameState.enemies.length, localGameState.ninjaPosition]);

  // Initial enemy spawn
  useEffect(() => {
    const initialSpawnTimer = setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnEnemy(), i * 200);
      }
    }, 1000);

    return () => clearTimeout(initialSpawnTimer);
  }, []);

  const toggleAutoFight = () => {
    setLocalGameState(prev => ({
      ...prev,
      isAutoFighting: !prev.isAutoFighting,
    }));
  };

  const getEnemyIcon = (type: Enemy['type']) => {
    const icons = { goblin: 'bug', orc: 'skull', skeleton: 'body', boss: 'flame' };
    return icons[type] as keyof typeof Ionicons.glyphMap;
  };

  const getEnemyColor = (type: Enemy['type']) => {
    const colors = { goblin: '#10b981', orc: '#ef4444', skeleton: '#8b5cf6', boss: '#f59e0b' };
    return colors[type];
  };

  const bottomTabs = [
    { id: 'stats', name: 'Stats', icon: 'person' },
    { id: 'shurikens', name: 'Weapons', icon: 'flash' },
    { id: 'pets', name: 'Pets', icon: 'heart' },
    { id: 'training', name: 'Training', icon: 'barbell' },
    { id: 'raids', name: 'Raids', icon: 'nuclear' },
    { id: 'adventure', name: 'Quest', icon: 'map' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Stats Bar */}
      <View style={styles.topStatsBar}>
        <View style={styles.topStat}>
          <Ionicons name="person" size={16} color="#8b5cf6" />
          <Text style={styles.topStatText}>Lv.{ninja.level}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="heart" size={16} color="#ef4444" />
          <Text style={styles.topStatText}>{ninja.health}/{ninja.maxHealth}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
          <Text style={styles.topStatText}>{ninja.gold}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="diamond" size={16} color="#3b82f6" />
          <Text style={styles.topStatText}>{ninja.gems}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.stageText}>Stage {localGameState.currentStage}</Text>
        </View>
      </View>

      {/* Experience Bar */}
      <View style={styles.expBar}>
        <View style={styles.expBarHeader}>
          <Text style={styles.expBarLabel}>Level {ninja.level}</Text>
          <Text style={styles.expBarText}>{ninja.experience}/{ninja.experienceToNext} XP</Text>
        </View>
        <View style={styles.expBarContainer}>
          <View style={styles.expBarBg}>
            <View 
              style={[
                styles.expBarFill,
                { width: `${(ninja.experience / ninja.experienceToNext) * 100}%` }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Battle Arena */}
      <View style={styles.gameArea}>
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
              left: ninjaAnimatedPosition.x._value + NINJA_SIZE / 2 - 30,
              top: ninjaAnimatedPosition.y._value + NINJA_SIZE / 2 - 30,
            },
          ]}
        />
      </View>

      {/* Quick Action Bar */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionBtn, localGameState.isAutoFighting && styles.activeButton]}
          onPress={toggleAutoFight}
        >
          <Ionicons 
            name={localGameState.isAutoFighting ? "pause" : "play"} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => {
            if (ninja.gems >= 5) {
              updateNinja({
                health: ninja.maxHealth,
                gems: ninja.gems - 5,
              });
            }
          }}
        >
          <Ionicons name="medical" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.enemyCounter}>
          <Text style={styles.enemyCounterText}>{localGameState.enemies.length}/10</Text>
          <Text style={styles.killsText}>{localGameState.killCount} kills</Text>
        </View>
      </View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomTabs}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeOverlay === tab.id && styles.activeTab]}
            onPress={() => setActiveOverlay(activeOverlay === tab.id ? null : tab.id as ActiveOverlay)}
          >
            <Ionicons 
              name={tab.icon as keyof typeof Ionicons.glyphMap} 
              size={20} 
              color={activeOverlay === tab.id ? "#8b5cf6" : "#9ca3af"} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeOverlay === tab.id ? "#8b5cf6" : "#9ca3af" }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlay Modals */}
      <Modal
        visible={activeOverlay !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveOverlay(null)}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            {activeOverlay === 'stats' && <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'shurikens' && <ShurikensOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'pets' && <PetsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'training' && <TrainingOverlay onClose={() => setActiveOverlay(null)} />}
            {(activeOverlay === 'raids' || activeOverlay === 'adventure') && (
              <View style={styles.comingSoonOverlay}>
                <Ionicons name="construct" size={60} color="#8b5cf6" />
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                  {activeOverlay === 'raids' ? 'Raid battles' : 'Adventure quests'} will be available in the next update.
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
});