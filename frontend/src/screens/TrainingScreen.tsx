import React, { useState } from 'react';
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

const TrainingScreen = () => {
  const { gameState, trainSkill, updateNinja } = useGame();
  const { ninja } = gameState;
  const [training, setTraining] = useState(false);

  const skills = [
    {
      name: 'Attack',
      key: 'attack',
      current: ninja.attack,
      icon: 'flash' as keyof typeof Ionicons.glyphMap,
      color: '#ef4444',
      description: 'Increases damage dealt in combat',
    },
    {
      name: 'Defense',
      key: 'defense',
      current: ninja.defense,
      icon: 'shield' as keyof typeof Ionicons.glyphMap,
      color: '#3b82f6',
      description: 'Reduces damage taken from enemies',
    },
    {
      name: 'Speed',
      key: 'speed',
      current: ninja.speed,
      icon: 'speedometer' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      description: 'Improves action speed and evasion',
    },
    {
      name: 'Luck',
      key: 'luck',
      current: ninja.luck,
      icon: 'star' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      description: 'Increases critical hits and rare drops',
    },
  ];

  const trainingActivities = [
    {
      name: 'Basic Training',
      duration: 30, // seconds for demo
      energyCost: 5,
      goldCost: 0,
      rewards: { experience: 15, gold: 5 },
      description: 'Light training session',
    },
    {
      name: 'Intense Training',
      duration: 60,
      energyCost: 10,
      goldCost: 20,
      rewards: { experience: 35, gold: 15 },
      description: 'Demanding workout session',
    },
    {
      name: 'Master Training',
      duration: 120,
      energyCost: 20,
      goldCost: 50,
      rewards: { experience: 80, gold: 40 },
      description: 'Elite training program',
    },
  ];

  const handleSkillUpgrade = (skillKey: string) => {
    if (ninja.skillPoints > 0) {
      trainSkill(skillKey);
      Alert.alert(
        'Skill Upgraded!',
        `Your ${skillKey} has been improved! Skill points remaining: ${ninja.skillPoints - 1}`
      );
    } else {
      Alert.alert('No Skill Points', 'Level up to earn more skill points!');
    }
  };

  const handleTraining = (activity: typeof trainingActivities[0]) => {
    if (ninja.energy < activity.energyCost) {
      Alert.alert('Insufficient Energy', `You need ${activity.energyCost} energy for this training.`);
      return;
    }
    
    if (ninja.gold < activity.goldCost) {
      Alert.alert('Insufficient Gold', `You need ${activity.goldCost} gold for this training.`);
      return;
    }

    setTraining(true);
    
    // Simulate training duration (shortened for demo)
    setTimeout(() => {
      updateNinja({
        experience: ninja.experience + activity.rewards.experience,
        gold: ninja.gold + activity.rewards.gold - activity.goldCost,
        energy: ninja.energy - activity.energyCost,
      });
      
      setTraining(false);
      Alert.alert(
        'Training Complete!',
        `You gained ${activity.rewards.experience} XP and ${activity.rewards.gold} gold!`
      );
    }, 2000); // 2 seconds for demo
  };

  const SkillCard = ({ skill }: { skill: typeof skills[0] }) => (
    <View style={styles.skillCard}>
      <View style={styles.skillHeader}>
        <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
          <Ionicons name={skill.icon} size={24} color={skill.color} />
        </View>
        <View style={styles.skillInfo}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillDescription}>{skill.description}</Text>
        </View>
        <Text style={styles.skillValue}>{skill.current}</Text>
      </View>
      
      <TouchableOpacity
        style={[styles.upgradeButton, { opacity: ninja.skillPoints > 0 ? 1 : 0.5 }]}
        onPress={() => handleSkillUpgrade(skill.key)}
        disabled={ninja.skillPoints === 0}
      >
        <LinearGradient colors={[skill.color, skill.color + 'CC']} style={styles.upgradeButtonGradient}>
          <Ionicons name="arrow-up" size={16} color="#ffffff" />
          <Text style={styles.upgradeButtonText}>Upgrade (1 SP)</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const TrainingCard = ({ activity }: { activity: typeof trainingActivities[0] }) => (
    <View style={styles.trainingCard}>
      <View style={styles.trainingHeader}>
        <Text style={styles.trainingName}>{activity.name}</Text>
        <Text style={styles.trainingDescription}>{activity.description}</Text>
      </View>
      
      <View style={styles.trainingStats}>
        <View style={styles.trainingStat}>
          <Ionicons name="time" size={16} color="#9ca3af" />
          <Text style={styles.trainingStatText}>{activity.duration}s</Text>
        </View>
        <View style={styles.trainingStat}>
          <Ionicons name="battery-half" size={16} color="#3b82f6" />
          <Text style={styles.trainingStatText}>{activity.energyCost}</Text>
        </View>
        <View style={styles.trainingStat}>
          <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
          <Text style={styles.trainingStatText}>{activity.goldCost}</Text>
        </View>
      </View>
      
      <View style={styles.trainingRewards}>
        <Text style={styles.rewardsTitle}>Rewards:</Text>
        <Text style={styles.rewardText}>+{activity.rewards.experience} XP</Text>
        <Text style={styles.rewardText}>+{activity.rewards.gold} Gold</Text>
      </View>
      
      <TouchableOpacity
        style={[styles.trainButton, { 
          opacity: (ninja.energy >= activity.energyCost && ninja.gold >= activity.goldCost && !training) ? 1 : 0.5 
        }]}
        onPress={() => handleTraining(activity)}
        disabled={ninja.energy < activity.energyCost || ninja.gold < activity.goldCost || training}
      >
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.trainButtonGradient}>
          {training ? (
            <>
              <Ionicons name="hourglass" size={20} color="#ffffff" />
              <Text style={styles.trainButtonText}>Training...</Text>
            </>
          ) : (
            <>
              <Ionicons name="fitness" size={20} color="#ffffff" />
              <Text style={styles.trainButtonText}>Start Training</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Training Center</Text>
        <Text style={styles.headerSubtitle}>Improve your ninja skills and abilities</Text>
        
        <View style={styles.resourcesRow}>
          <View style={styles.resource}>
            <Ionicons name="star" size={20} color="#8b5cf6" />
            <Text style={styles.resourceText}>{ninja.skillPoints} Skill Points</Text>
          </View>
          <View style={styles.resource}>
            <Ionicons name="battery-half" size={20} color="#3b82f6" />
            <Text style={styles.resourceText}>{ninja.energy}/{ninja.maxEnergy} Energy</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Skills Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ninja Skills</Text>
        <Text style={styles.sectionSubtitle}>Use skill points to permanently increase your abilities</Text>
        
        {skills.map((skill) => (
          <SkillCard key={skill.key} skill={skill} />
        ))}
      </View>

      {/* Training Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Activities</Text>
        <Text style={styles.sectionSubtitle}>Complete training sessions to gain experience and gold</Text>
        
        {trainingActivities.map((activity, index) => (
          <TrainingCard key={index} activity={activity} />
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
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resourceText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 20,
  },
  skillCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  skillDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  skillValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  upgradeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trainingCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  trainingHeader: {
    marginBottom: 12,
  },
  trainingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  trainingDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  trainingStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  trainingStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingStatText: {
    color: '#d1d5db',
    fontSize: 12,
    marginLeft: 4,
  },
  trainingRewards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rewardsTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  rewardText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  trainButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  trainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  trainButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TrainingScreen;