import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';

const AdventureScreen = () => {
  const { gameState, startAdventure, completeAdventure, updateNinja } = useGame();
  const { ninja, currentAdventure } = gameState;
  const [timeRemaining, setTimeRemaining] = useState(0);

  const adventures = [
    {
      id: '1',
      name: 'Herb Gathering',
      location: 'Mystic Forest',
      duration: 60, // 1 minute for demo
      energyCost: 5,
      requirements: { level: 1 },
      rewards: {
        gold: 20,
        experience: 20,
        items: ['Healing Herb', 'Magic Leaf'],
      },
      description: 'Collect rare herbs from the mystical forest.',
      icon: 'leaf',
      difficulty: 'Easy',
    },
    {
      id: '2',
      name: 'Treasure Hunt',
      location: 'Ancient Ruins',
      duration: 120, // 2 minutes for demo
      energyCost: 10,
      requirements: { level: 3 },
      rewards: {
        gold: 50,
        experience: 25,
        items: ['Ancient Coin', 'Rare Gem', 'Old Map'],
      },
      description: 'Search for hidden treasures in forgotten ruins.',
      icon: 'diamond',
      difficulty: 'Medium',
    },
    {
      id: '3',
      name: 'Monster Hunt',
      location: 'Dark Swamp',
      duration: 180, // 3 minutes for demo
      energyCost: 15,
      requirements: { level: 5 },
      rewards: {
        gold: 80,
        experience: 40,
        items: ['Monster Fang', 'Swamp Essence', 'Hunter Badge'],
      },
      description: 'Hunt dangerous creatures in the murky swamp.',
      icon: 'skull',
      difficulty: 'Hard',
    },
    {
      id: '4',
      name: 'Elemental Ritual',
      location: 'Elemental Shrine',
      duration: 300, // 5 minutes for demo
      energyCost: 20,
      requirements: { level: 8 },
      rewards: {
        gold: 120,
        experience: 60,
        items: ['Elemental Crystal', 'Sacred Water', 'Spirit Orb'],
      },
      description: 'Perform ancient rituals at the elemental shrine.',
      icon: 'flame',
      difficulty: 'Expert',
    },
    {
      id: '5',
      name: 'Dragon Quest',
      location: 'Dragon\'s Lair',
      duration: 600, // 10 minutes for demo
      energyCost: 30,
      requirements: { level: 12 },
      rewards: {
        gold: 200,
        experience: 100,
        items: ['Dragon Scale', 'Dragon Claw', 'Ancient Scroll'],
      },
      description: 'Face the legendary dragon in its lair.',
      icon: 'flame',
      difficulty: 'Legendary',
    },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentAdventure && currentAdventure.startTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - (currentAdventure.startTime || 0);
        const remaining = Math.max(0, (currentAdventure.duration * 1000) - elapsed);
        
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          completeAdventure();
          Alert.alert(
            'Adventure Complete!',
            `Your ${currentAdventure.name} adventure is finished!\n\nRewards:\n+${currentAdventure.rewards.gold} Gold\n+${currentAdventure.rewards.experience} XP\n${currentAdventure.rewards.items.join(', ')}`
          );
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentAdventure, completeAdventure]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      case 'Expert': return '#8b5cf6';
      case 'Legendary': return '#f97316';
      default: return '#6b7280';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAdventure = (adventure: typeof adventures[0]) => {
    if (ninja.level < adventure.requirements.level) {
      Alert.alert('Adventure Locked', `Reach level ${adventure.requirements.level} to unlock this adventure.`);
      return;
    }

    if (ninja.energy < adventure.energyCost) {
      Alert.alert('Insufficient Energy', `You need ${adventure.energyCost} energy to start this adventure.`);
      return;
    }

    if (currentAdventure) {
      Alert.alert('Adventure in Progress', 'You are already on an adventure! Wait for it to complete.');
      return;
    }

    startAdventure(adventure.id);
    Alert.alert(
      'Adventure Started!',
      `You have begun the ${adventure.name} adventure. It will take ${adventure.duration} seconds to complete.`
    );
  };

  const handleCompleteAdventure = () => {
    if (currentAdventure) {
      completeAdventure();
      Alert.alert(
        'Adventure Complete!',
        `Your ${currentAdventure.name} adventure is finished!\n\nRewards:\n+${currentAdventure.rewards.gold} Gold\n+${currentAdventure.rewards.experience} XP\n${currentAdventure.rewards.items.join(', ')}`
      );
    }
  };

  const AdventureCard = ({ adventure }: { adventure: typeof adventures[0] }) => {
    const isUnlocked = ninja.level >= adventure.requirements.level;
    const canStart = isUnlocked && ninja.energy >= adventure.energyCost && !currentAdventure;
    const isActive = currentAdventure?.id === adventure.id;

    return (
      <View style={[styles.adventureCard, { opacity: isUnlocked ? 1 : 0.6 }]}>
        <LinearGradient
          colors={isActive ? ['#065f46', '#047857'] : ['#374151', '#4b5563']}
          style={styles.adventureGradient}
        >
          {/* Header */}
          <View style={styles.adventureHeader}>
            <View style={styles.adventureInfo}>
              <Text style={styles.adventureName}>{adventure.name}</Text>
              <Text style={styles.adventureLocation}>{adventure.location}</Text>
            </View>
            <View style={styles.adventureIcon}>
              <Ionicons name={adventure.icon as keyof typeof Ionicons.glyphMap} size={32} color="#8b5cf6" />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.adventureDescription}>{adventure.description}</Text>

          {/* Stats */}
          <View style={styles.adventureStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="#9ca3af" />
                <Text style={styles.statText}>{adventure.duration}s</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="battery-half" size={16} color="#3b82f6" />
                <Text style={styles.statText}>{adventure.energyCost}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={16} color="#f59e0b" />
                <Text style={styles.statText}>Lv.{adventure.requirements.level}+</Text>
              </View>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(adventure.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(adventure.difficulty) }]}>
                {adventure.difficulty}
              </Text>
            </View>
          </View>

          {/* Rewards */}
          <View style={styles.rewardsContainer}>
            <Text style={styles.rewardsTitle}>Rewards:</Text>
            <View style={styles.rewardsList}>
              <Text style={styles.rewardText}>+{adventure.rewards.gold} Gold</Text>
              <Text style={styles.rewardText}>+{adventure.rewards.experience} XP</Text>
            </View>
            <Text style={styles.itemsText}>{adventure.rewards.items.join(', ')}</Text>
          </View>

          {/* Action Button */}
          {isActive ? (
            <View style={styles.activeContainer}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>In Progress...</Text>
                <Text style={styles.timeText}>{formatTime(timeRemaining)} remaining</Text>
              </View>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleCompleteAdventure}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.completeButtonGradient}>
                  <Text style={styles.completeButtonText}>Complete Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, { opacity: canStart ? 1 : 0.5 }]}
              onPress={() => handleStartAdventure(adventure)}
              disabled={!canStart}
            >
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.startButtonGradient}>
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.startButtonText}>Start Adventure</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
        <Text style={styles.headerTitle}>Adventure Realm</Text>
        <Text style={styles.headerSubtitle}>Embark on exciting quests for rewards</Text>
        
        <View style={styles.playerInfo}>
          <View style={styles.playerStat}>
            <Ionicons name="person" size={16} color="#8b5cf6" />
            <Text style={styles.playerStatText}>Level {ninja.level}</Text>
          </View>
          <View style={styles.playerStat}>
            <Ionicons name="battery-half" size={16} color="#3b82f6" />
            <Text style={styles.playerStatText}>{ninja.energy}/{ninja.maxEnergy}</Text>
          </View>
        </View>

        {currentAdventure && (
          <View style={styles.currentAdventureNotice}>
            <Ionicons name="compass" size={16} color="#10b981" />
            <Text style={styles.currentAdventureText}>
              Currently on: {currentAdventure.name}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Adventures */}
      <View style={styles.adventuresContainer}>
        {adventures.map((adventure) => (
          <AdventureCard key={adventure.id} adventure={adventure} />
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
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  currentAdventureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#065f46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  currentAdventureText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  adventuresContainer: {
    padding: 20,
  },
  adventureCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  adventureGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  adventureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adventureInfo: {
    flex: 1,
  },
  adventureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  adventureLocation: {
    fontSize: 14,
    color: '#8b5cf6',
    marginTop: 2,
  },
  adventureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adventureDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  adventureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
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
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardsContainer: {
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 6,
  },
  rewardsList: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  itemsText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeContainer: {
    gap: 12,
  },
  progressContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  progressText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 2,
  },
  completeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdventureScreen;