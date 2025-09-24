import React, { useEffect } from 'react';
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

const NinjaStatsScreen = () => {
  const { gameState, updateNinja, collectIdleRewards } = useGame();
  const { ninja } = gameState;

  useEffect(() => {
    // Check for idle rewards when screen loads
    collectIdleRewards();
  }, []);

  useEffect(() => {
    // Level up check
    if (ninja.experience >= ninja.experienceToNext) {
      const newLevel = ninja.level + 1;
      const remainingExp = ninja.experience - ninja.experienceToNext;
      const newExpToNext = newLevel * 100;
      
      updateNinja({
        level: newLevel,
        experience: remainingExp,
        experienceToNext: newExpToNext,
        maxHealth: ninja.maxHealth + 10,
        health: ninja.maxHealth + 10,
        maxEnergy: ninja.maxEnergy + 5,
        energy: ninja.maxEnergy + 5,
        skillPoints: ninja.skillPoints + 1,
        attack: ninja.attack + 1,
        defense: ninja.defense + 1,
      });

      Alert.alert(
        'Level Up!',
        `Congratulations! You reached level ${newLevel}!\n+1 Skill Point earned!`,
        [{ text: 'Awesome!' }]
      );
    }
  }, [ninja.experience]);

  const StatBar = ({ 
    label, 
    current, 
    max, 
    color, 
    showNumbers = true 
  }: {
    label: string;
    current: number;
    max?: number;
    color: string;
    showNumbers?: boolean;
  }) => (
    <View style={styles.statContainer}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        {showNumbers && (
          <Text style={styles.statValue}>
            {max ? `${current}/${max}` : current}
          </Text>
        )}
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

  const ResourceCard = ({ 
    icon, 
    label, 
    value, 
    color 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={styles.resourceCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.resourceLabel}>{label}</Text>
      <Text style={styles.resourceValue}>{value.toLocaleString()}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerGradient}>
        {/* Ninja Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#ffffff" />
          </View>
          <Text style={styles.ninjaName}>Shadow Ninja</Text>
          <Text style={styles.ninjaLevel}>Level {ninja.level}</Text>
        </View>

        {/* Resources */}
        <View style={styles.resourcesContainer}>
          <ResourceCard icon="logo-bitcoin" label="Gold" value={ninja.gold} color="#fbbf24" />
          <ResourceCard icon="diamond" label="Gems" value={ninja.gems} color="#3b82f6" />
          <ResourceCard icon="star" label="Skill Points" value={ninja.skillPoints} color="#8b5cf6" />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Character Stats</Text>
        
        <StatBar 
          label="Health" 
          current={ninja.health} 
          max={ninja.maxHealth} 
          color="#ef4444" 
        />
        
        <StatBar 
          label="Energy" 
          current={ninja.energy} 
          max={ninja.maxEnergy} 
          color="#3b82f6" 
        />
        
        <StatBar 
          label="Experience" 
          current={ninja.experience} 
          max={ninja.experienceToNext} 
          color="#10b981" 
        />

        <View style={styles.attributesGrid}>
          <View style={styles.attributeCard}>
            <Ionicons name="flash" size={20} color="#ef4444" />
            <Text style={styles.attributeLabel}>Attack</Text>
            <Text style={styles.attributeValue}>{ninja.attack}</Text>
          </View>
          
          <View style={styles.attributeCard}>
            <Ionicons name="shield" size={20} color="#3b82f6" />
            <Text style={styles.attributeLabel}>Defense</Text>
            <Text style={styles.attributeValue}>{ninja.defense}</Text>
          </View>
          
          <View style={styles.attributeCard}>
            <Ionicons name="speedometer" size={20} color="#10b981" />
            <Text style={styles.attributeLabel}>Speed</Text>
            <Text style={styles.attributeValue}>{ninja.speed}</Text>
          </View>
          
          <View style={styles.attributeCard}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.attributeLabel}>Luck</Text>
            <Text style={styles.attributeValue}>{ninja.luck}</Text>
          </View>
        </View>
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
          <View style={styles.buttonGradient}>
            <Ionicons name="battery-charging" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Rest (+10 Energy)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { opacity: ninja.health < ninja.maxHealth ? 1 : 0.5 }]}
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
          <View style={styles.buttonGradient}>
            <Ionicons name="medical" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Heal (20 Gold)</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerGradient: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#1e293b',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#8b5cf6',
  },
  ninjaName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  ninjaLevel: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  resourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  resourceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
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
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  attributeCard: {
    width: '48%',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  attributeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  attributeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
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
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NinjaStatsScreen;