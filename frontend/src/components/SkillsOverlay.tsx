import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';

interface Props {
  onClose: () => void;
}

const SkillsOverlay = ({ onClose }: Props) => {
  const { gameState, trainSkill } = useGame();
  const { ninja } = gameState;

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skills</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Skill Points Info */}
        <View style={styles.skillPointsCard}>
          <Ionicons name="star" size={24} color="#8b5cf6" />
          <Text style={styles.skillPointsText}>
            {ninja.skillPoints} Skill Points Available
          </Text>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Upgrades</Text>
          <Text style={styles.sectionSubtitle}>Use skill points to permanently increase your abilities</Text>
          
          {skills.map((skill) => (
            <View key={skill.key} style={styles.skillCard}>
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
                style={[styles.upgradeButton, { 
                  opacity: ninja.skillPoints > 0 ? 1 : 0.5,
                  backgroundColor: skill.color + '20'
                }]}
                onPress={() => handleSkillUpgrade(skill.key)}
                disabled={ninja.skillPoints === 0}
              >
                <View style={[styles.upgradeButtonContent, { borderColor: skill.color }]}>
                  <Ionicons name="arrow-up" size={16} color={skill.color} />
                  <Text style={[styles.upgradeButtonText, { color: skill.color }]}>
                    Upgrade (1 SP)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {ninja.skillPoints === 0 && (
          <View style={styles.noSkillPointsCard}>
            <Ionicons name="information-circle" size={32} color="#9ca3af" />
            <Text style={styles.noSkillPointsTitle}>No Skill Points Available</Text>
            <Text style={styles.noSkillPointsText}>
              Level up your ninja to earn skill points! You gain 3 skill points per level.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  skillPointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  skillPointsText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
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
  upgradeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noSkillPointsCard: {
    alignItems: 'center',
    backgroundColor: '#374151',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  noSkillPointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 8,
  },
  noSkillPointsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SkillsOverlay;