import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { GameProvider, useGame } from '../src/contexts/GameContext';

function NinjaStatsContent() {
  const { gameState, updateNinja, collectIdleRewards } = useGame();
  const { ninja } = gameState;

  React.useEffect(() => {
    collectIdleRewards();
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#ffffff" />
          </View>
          <Text style={styles.ninjaName}>Shadow Ninja</Text>
          <Text style={styles.ninjaLevel}>Level {ninja.level}</Text>
        </View>

        {/* Resources */}
        <View style={styles.resourcesContainer}>
          <View style={styles.resourceCard}>
            <Ionicons name="logo-bitcoin" size={20} color="#fbbf24" />
            <Text style={styles.resourceLabel}>Gold</Text>
            <Text style={styles.resourceValue}>{ninja.gold}</Text>
          </View>
          <View style={styles.resourceCard}>
            <Ionicons name="diamond" size={20} color="#3b82f6" />
            <Text style={styles.resourceLabel}>Gems</Text>
            <Text style={styles.resourceValue}>{ninja.gems}</Text>
          </View>
          <View style={styles.resourceCard}>
            <Ionicons name="star" size={20} color="#8b5cf6" />
            <Text style={styles.resourceLabel}>SP</Text>
            <Text style={styles.resourceValue}>{ninja.skillPoints}</Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Character Stats</Text>
        
        <StatBar label="Health" current={ninja.health} max={ninja.maxHealth} color="#ef4444" />
        <StatBar label="Energy" current={ninja.energy} max={ninja.maxEnergy} color="#3b82f6" />
        <StatBar label="Experience" current={ninja.experience} max={ninja.experienceToNext} color="#10b981" />

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

      {/* Navigation Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Game Menu</Text>
        
        <Link href="/shurikens" asChild>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="flash" size={24} color="#8b5cf6" />
              <Text style={styles.menuButtonText}>Shurikens</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/pets" asChild>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="heart" size={24} color="#ef4444" />
              <Text style={styles.menuButtonText}>Pets</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/training" asChild>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="barbell" size={24} color="#10b981" />
              <Text style={styles.menuButtonText}>Training</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/raids" asChild>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="sword" size={24} color="#f59e0b" />
              <Text style={styles.menuButtonText}>Raids</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/adventure" asChild>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="map" size={24} color="#06b6d4" />
              <Text style={styles.menuButtonText}>Adventures</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </Link>
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
          <View style={styles.buttonContent}>
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
          <View style={styles.buttonContent}>
            <Ionicons name="medical" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Heal (20 Gold)</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function NinjaMasterApp() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <GameProvider>
          <NinjaStatsContent />
        </GameProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    gap: 8,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  resourceLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  resourceValue: {
    fontSize: 14,
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
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
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
    marginTop: 6,
  },
  attributeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  menuSection: {
    padding: 20,
    paddingTop: 0,
  },
  menuButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 12,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    marginBottom: 12,
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