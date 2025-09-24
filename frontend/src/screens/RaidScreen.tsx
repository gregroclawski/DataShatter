import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';

const RaidScreen = () => {
  const { gameState, startRaid, updateNinja } = useGame();
  const { ninja } = gameState;
  const [battling, setBattling] = useState(false);
  const [battleAnimation] = useState(new Animated.Value(0));

  const raids = [
    {
      id: '1',
      name: 'Shadow Forest',
      boss: 'Dark Wolf Alpha',
      level: 1,
      difficulty: 'Easy',
      energyCost: 10,
      rewards: {
        gold: 50,
        experience: 30,
        items: ['Common Shuriken Pack'],
      },
      unlocked: true,
      completed: false,
      bossHealth: 80,
      description: 'A menacing wolf that lurks in the shadows of the ancient forest.',
    },
    {
      id: '2',
      name: 'Crystal Caverns',
      boss: 'Crystal Golem',
      level: 5,
      difficulty: 'Medium',
      energyCost: 15,
      rewards: {
        gold: 100,
        experience: 60,
        items: ['Rare Shuriken Pack', 'Pet Scroll'],
      },
      unlocked: ninja.level >= 5,
      completed: false,
      bossHealth: 150,
      description: 'A massive golem made of pure crystal, immune to most attacks.',
    },
    {
      id: '3',
      name: 'Volcano Peak',
      boss: 'Fire Dragon',
      level: 10,
      difficulty: 'Hard',
      energyCost: 25,
      rewards: {
        gold: 200,
        experience: 120,
        items: ['Epic Shuriken Pack', 'Dragon Egg', 'Fire Essence'],
      },
      unlocked: ninja.level >= 10,
      completed: false,
      bossHealth: 300,
      description: 'An ancient dragon that guards the treasures of the volcanic peak.',
    },
    {
      id: '4',
      name: 'Void Realm',
      boss: 'Shadow Lord',
      level: 20,
      difficulty: 'Legendary',
      energyCost: 40,
      rewards: {
        gold: 500,
        experience: 300,
        items: ['Legendary Shuriken Pack', 'Shadow Essence', 'Master Scroll'],
      },
      unlocked: ninja.level >= 20,
      completed: false,
      bossHealth: 600,
      description: 'The ultimate challenge - a being from the void dimension.',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      case 'Legendary': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getBossIcon = (bossName: string) => {
    if (bossName.includes('Wolf')) return 'paw';
    if (bossName.includes('Golem')) return 'diamond';
    if (bossName.includes('Dragon')) return 'flame';
    if (bossName.includes('Shadow')) return 'eye';
    return 'skull';
  };

  const calculateWinChance = (raid: typeof raids[0]) => {
    const playerPower = ninja.attack + ninja.defense + ninja.speed + ninja.luck;
    const bossPower = raid.bossHealth / 5;
    const winChance = Math.min(95, Math.max(5, (playerPower / bossPower) * 50));
    return Math.round(winChance);
  };

  const handleStartRaid = (raid: typeof raids[0]) => {
    if (!raid.unlocked) {
      Alert.alert('Raid Locked', `Reach level ${raid.level} to unlock this raid.`);
      return;
    }

    if (ninja.energy < raid.energyCost) {
      Alert.alert('Insufficient Energy', `You need ${raid.energyCost} energy to start this raid.`);
      return;
    }

    setBattling(true);

    // Start battle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(battleAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(battleAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate battle (3 seconds)
    setTimeout(() => {
      const winChance = calculateWinChance(raid);
      const success = Math.random() * 100 < winChance;
      
      battleAnimation.stopAnimation();
      battleAnimation.setValue(0);
      setBattling(false);

      if (success) {
        // Victory
        updateNinja({
          gold: ninja.gold + raid.rewards.gold,
          experience: ninja.experience + raid.rewards.experience,
          energy: ninja.energy - raid.energyCost,
        });

        Alert.alert(
          'Victory!',
          `You defeated the ${raid.boss}!\n\nRewards:\n+${raid.rewards.gold} Gold\n+${raid.rewards.experience} XP\n${raid.rewards.items.join(', ')}`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      } else {
        // Defeat
        const healthLoss = Math.floor(raid.bossHealth * 0.3);
        updateNinja({
          health: Math.max(1, ninja.health - healthLoss),
          energy: ninja.energy - raid.energyCost,
        });

        Alert.alert(
          'Defeat!',
          `The ${raid.boss} was too powerful!\n\nYou lost ${healthLoss} health.`,
          [{ text: 'Try Again', style: 'destructive' }]
        );
      }
    }, 3000);
  };

  const RaidCard = ({ raid }: { raid: typeof raids[0] }) => {
    const winChance = calculateWinChance(raid);
    
    return (
      <View style={[styles.raidCard, { opacity: raid.unlocked ? 1 : 0.6 }]}>
        <LinearGradient
          colors={['#374151', '#4b5563']}
          style={styles.raidGradient}
        >
          {/* Header */}
          <View style={styles.raidHeader}>
            <View style={styles.raidInfo}>
              <Text style={styles.raidName}>{raid.name}</Text>
              <Text style={styles.bossName}>{raid.boss}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(raid.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(raid.difficulty) }]}>
                {raid.difficulty}
              </Text>
            </View>
          </View>

          {/* Boss Icon */}
          <View style={styles.bossContainer}>
            <View style={styles.bossIcon}>
              <Ionicons name={getBossIcon(raid.boss) as keyof typeof Ionicons.glyphMap} size={40} color="#ef4444" />
            </View>
            <Text style={styles.bossDescription}>{raid.description}</Text>
          </View>

          {/* Stats */}
          <View style={styles.raidStats}>
            <View style={styles.statItem}>
              <Ionicons name="fitness" size={16} color="#ef4444" />
              <Text style={styles.statText}>{raid.bossHealth} HP</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="battery-half" size={16} color="#3b82f6" />
              <Text style={styles.statText}>{raid.energyCost} Energy</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={16} color="#f59e0b" />
              <Text style={styles.statText}>Lv.{raid.level}+</Text>
            </View>
          </View>

          {/* Win Chance */}
          <View style={styles.winChanceContainer}>
            <Text style={styles.winChanceLabel}>Win Chance</Text>
            <View style={styles.winChanceBar}>
              <View style={[styles.winChanceFill, { width: `${winChance}%`, backgroundColor: getDifficultyColor(raid.difficulty) }]} />
            </View>
            <Text style={[styles.winChanceText, { color: getDifficultyColor(raid.difficulty) }]}>{winChance}%</Text>
          </View>

          {/* Rewards */}
          <View style={styles.rewardsContainer}>
            <Text style={styles.rewardsTitle}>Rewards:</Text>
            <Text style={styles.rewardText}>+{raid.rewards.gold} Gold</Text>
            <Text style={styles.rewardText}>+{raid.rewards.experience} XP</Text>
            <Text style={styles.rewardText}>{raid.rewards.items.join(', ')}</Text>
          </View>

          {/* Battle Button */}
          <TouchableOpacity
            style={[styles.battleButton, { 
              opacity: (raid.unlocked && ninja.energy >= raid.energyCost && !battling) ? 1 : 0.5 
            }]}
            onPress={() => handleStartRaid(raid)}
            disabled={!raid.unlocked || ninja.energy < raid.energyCost || battling}
          >
            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.battleButtonGradient}>
              {battling ? (
                <>
                  <Animated.View style={{
                    transform: [{
                      rotate: battleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }}>
                    <Ionicons name="flash" size={20} color="#ffffff" />
                  </Animated.View>
                  <Text style={styles.battleButtonText}>Fighting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sword" size={20} color="#ffffff" />
                  <Text style={styles.battleButtonText}>Start Raid</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Raid Center</Text>
        <Text style={styles.headerSubtitle}>Challenge powerful bosses for epic rewards</Text>
        
        <View style={styles.playerStats}>
          <View style={styles.playerStat}>
            <Ionicons name="fitness" size={16} color="#ef4444" />
            <Text style={styles.playerStatText}>ATK: {ninja.attack}</Text>
          </View>
          <View style={styles.playerStat}>
            <Ionicons name="shield" size={16} color="#3b82f6" />
            <Text style={styles.playerStatText}>DEF: {ninja.defense}</Text>
          </View>
          <View style={styles.playerStat}>
            <Ionicons name="battery-half" size={16} color="#10b981" />
            <Text style={styles.playerStatText}>{ninja.energy}/{ninja.maxEnergy}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Raids */}
      <View style={styles.raidsContainer}>
        {raids.map((raid) => (
          <RaidCard key={raid.id} raid={raid} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playerStatText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  raidsContainer: {
    padding: 20,
  },
  raidCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  raidGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  raidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  raidInfo: {
    flex: 1,
  },
  raidName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  bossName: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bossContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bossIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bossDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  raidStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#d1d5db',
    fontSize: 12,
    marginLeft: 4,
  },
  winChanceContainer: {
    marginBottom: 16,
  },
  winChanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  winChanceBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  winChanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  winChanceText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardsContainer: {
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  battleButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  battleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  battleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RaidScreen;