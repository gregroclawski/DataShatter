import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';

interface Props {
  onClose: () => void;
}

const NinjaStatsOverlay = ({ onClose }: Props) => {
  const { gameState, updateNinja, trainSkill } = useGame();
  const { ninja } = gameState;

  const StatBar = ({ 
    label, 
    current, 
    max, 
    color 
  }: {
    label: string;
    current: number;
    max?: number;
    color: string;
  }) => (
    <View style={styles.statContainer}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>
          {max ? `${current}/${max}` : current}
        </Text>
      </View>
      {max && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(current / max) * 100}%`, backgroundColor: color }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );

  const handleSkillUpgrade = (skillKey: string) => {
    if (ninja.skillPoints > 0) {
      trainSkill(skillKey);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ninja Stats</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Character Info */}
        <View style={styles.characterSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#ffffff" />
          </View>
          <Text style={styles.characterName}>Shadow Ninja</Text>
          <Text style={styles.characterLevel}>Level {ninja.level}</Text>
        </View>

        {/* Primary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Stats</Text>
          
          <StatBar label="Health" current={ninja.health} max={ninja.maxHealth} color="#ef4444" />
          <StatBar label="Energy" current={ninja.energy} max={ninja.maxEnergy} color="#3b82f6" />
          <StatBar label="Experience" current={ninja.experience} max={ninja.experienceToNext} color="#10b981" />
        </View>

        {/* Combat Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combat Stats</Text>
          
          <View style={styles.combatStatsGrid}>
            <View style={styles.combatStatCard}>
              <Ionicons name="flash" size={20} color="#ef4444" />
              <Text style={styles.combatStatLabel}>Attack</Text>
              <Text style={styles.combatStatValue}>{ninja.attack}</Text>
              {ninja.skillPoints > 0 && (
                <TouchableOpacity 
                  style={styles.upgradeBtn}
                  onPress={() => handleSkillUpgrade('attack')}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.combatStatCard}>
              <Ionicons name="shield" size={20} color="#3b82f6" />
              <Text style={styles.combatStatLabel}>Defense</Text>
              <Text style={styles.combatStatValue}>{ninja.defense}</Text>
              {ninja.skillPoints > 0 && (
                <TouchableOpacity 
                  style={styles.upgradeBtn}
                  onPress={() => handleSkillUpgrade('defense')}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.combatStatCard}>
              <Ionicons name="speedometer" size={20} color="#10b981" />
              <Text style={styles.combatStatLabel}>Speed</Text>
              <Text style={styles.combatStatValue}>{ninja.speed}</Text>
              {ninja.skillPoints > 0 && (
                <TouchableOpacity 
                  style={styles.upgradeBtn}
                  onPress={() => handleSkillUpgrade('speed')}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.combatStatCard}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.combatStatLabel}>Luck</Text>
              <Text style={styles.combatStatValue}>{ninja.luck}</Text>
              {ninja.skillPoints > 0 && (
                <TouchableOpacity 
                  style={styles.upgradeBtn}
                  onPress={() => handleSkillUpgrade('luck')}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {ninja.skillPoints > 0 && (
            <View style={styles.skillPointsInfo}>
              <Ionicons name="star" size={16} color="#8b5cf6" />
              <Text style={styles.skillPointsText}>
                {ninja.skillPoints} Skill Points Available
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, { opacity: ninja.energy < ninja.maxEnergy ? 1 : 0.5 }]}
            onPress={() => {
              if (ninja.energy < ninja.maxEnergy) {
                updateNinja({ energy: Math.min(ninja.maxEnergy, ninja.energy + 10) });
              }
            }}
            disabled={ninja.energy >= ninja.maxEnergy}
          >
            <View style={[styles.buttonContent, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="battery-charging" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Rest (+10 Energy)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { opacity: ninja.health < ninja.maxHealth && ninja.gold >= 20 ? 1 : 0.5 }]}
            onPress={() => {
              if (ninja.health < ninja.maxHealth && ninja.gold >= 20) {
                updateNinja({ 
                  health: Math.min(ninja.maxHealth, ninja.health + 25),
                  gold: ninja.gold - 20
                });
              }
            }}
            disabled={ninja.health >= ninja.maxHealth || ninja.gold < 20}
          >
            <View style={[styles.buttonContent, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="medical" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Heal (20 Gold)</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  characterSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  characterLevel: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  statContainer: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#d1d5db',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  combatStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  combatStatCard: {
    width: '48%',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
    position: 'relative',
  },
  combatStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  combatStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  upgradeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8b5cf6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillPointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  skillPointsText: {
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NinjaStatsOverlay;