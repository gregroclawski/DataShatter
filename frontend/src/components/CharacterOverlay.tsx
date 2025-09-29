import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { MythicTechColors } from '../theme/MythicTechTheme';

interface Props {
  onClose: () => void;
}

const CharacterOverlay = ({ onClose }: Props) => {
  const { gameState, updateNinja, trainSkill, getEffectiveStats } = useGame();
  const { ninja } = gameState;
  const effectiveStats = getEffectiveStats();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'skills'>('stats');
  const [skillUpgradeType, setSkillUpgradeType] = useState<'gold' | 'skillPoints'>('gold');
  const [upgradeQuantity, setUpgradeQuantity] = useState<1 | 10 | 'max'>(1);

  // Skill upgrade costs (gold-based progression)
  const getSkillUpgradeCost = (currentLevel: number) => {
    return Math.floor(100 + (currentLevel * currentLevel * 10));
  };

  // Calculate bulk upgrade costs and quantities
  const calculateUpgradeCost = (skill: any, quantity: 1 | 10 | 'max') => {
    if (skillUpgradeType === 'skillPoints') {
      if (quantity === 'max') {
        return { cost: ninja.skillPoints, quantity: ninja.skillPoints, type: 'SP' };
      }
      const actualQuantity = Math.min(quantity, ninja.skillPoints);
      return { cost: actualQuantity, quantity: actualQuantity, type: 'SP' };
    } else {
      // Gold upgrades with escalating costs - use ONLY gold levels for cost calculation
      let totalCost = 0;
      let currentLevel = skill.goldLevels; // Use only gold upgrade levels for cost calculation
      let actualQuantity = 0;

      if (quantity === 'max') {
        // Calculate max affordable upgrades
        while (totalCost + getSkillUpgradeCost(currentLevel) <= ninja.gold) {
          totalCost += getSkillUpgradeCost(currentLevel);
          currentLevel++;
          actualQuantity++;
        }
      } else {
        // Calculate cost for specific quantity
        for (let i = 0; i < quantity; i++) {
          const upgradeCost = getSkillUpgradeCost(currentLevel);
          if (totalCost + upgradeCost <= ninja.gold) {
            totalCost += upgradeCost;
            currentLevel++;
            actualQuantity++;
          } else {
            break;
          }
        }
      }
      
      return { cost: totalCost, quantity: actualQuantity, type: 'Gold' };
    }
  };

  // Calculate actual skill upgrade levels (separate display for gold vs skill points)
  const getSkillUpgradeLevel = (skillKey: string, upgradeType: 'gold' | 'skillPoints' | 'total') => {
    const goldUpgrades = ninja.goldUpgrades || { attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0 };
    const skillPointUpgrades = ninja.skillPointUpgrades || { attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0 };
    
    // For health and energy, use maxHealth/maxEnergy keys
    const actualKey = skillKey === 'health' ? 'maxHealth' : skillKey === 'energy' ? 'maxEnergy' : skillKey;
    
    const goldStatPoints = goldUpgrades[actualKey as keyof typeof goldUpgrades] || 0;
    const spStatPoints = skillPointUpgrades[actualKey as keyof typeof skillPointUpgrades] || 0;
    
    // Convert stat points back to upgrade levels for display
    // Gold: 1 level = 1 stat point (10 for health/energy)
    // Skill Points: 1 level = 3 stat points (15 for health/energy) - MORE BENEFICIAL
    const goldLevels = skillKey === 'health' || skillKey === 'energy' ? Math.floor(goldStatPoints / 10) : goldStatPoints;
    const spLevels = skillKey === 'health' || skillKey === 'energy' ? Math.floor(spStatPoints / 15) : Math.floor(spStatPoints / 3);
    
    if (upgradeType === 'gold') return goldLevels;
    if (upgradeType === 'skillPoints') return spLevels;
    return goldLevels + spLevels; // total
  };

  const skills = [
    {
      name: 'Attack Power',
      key: 'attack',
      current: getSkillUpgradeLevel('attack', 'total'),
      goldLevels: getSkillUpgradeLevel('attack', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('attack', 'skillPoints'),
      icon: 'flash' as keyof typeof Ionicons.glyphMap,
      color: '#ef4444',
      description: 'Increases damage dealt in combat',
    },
    {
      name: 'Defense',
      key: 'defense', 
      current: getSkillUpgradeLevel('defense', 'total'),
      goldLevels: getSkillUpgradeLevel('defense', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('defense', 'skillPoints'),
      icon: 'shield' as keyof typeof Ionicons.glyphMap,
      color: '#3b82f6',
      description: 'Reduces damage taken from enemies',
    },
    {
      name: 'Health',
      key: 'maxHealth',
      current: getSkillUpgradeLevel('health', 'total'),
      goldLevels: getSkillUpgradeLevel('health', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('health', 'skillPoints'),
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      description: 'Increases maximum health points',
    },
    {
      name: 'Energy',
      key: 'maxEnergy',
      current: getSkillUpgradeLevel('energy', 'total'),
      goldLevels: getSkillUpgradeLevel('energy', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('energy', 'skillPoints'),
      icon: 'battery-charging' as keyof typeof Ionicons.glyphMap,
      color: '#8b5cf6',
      description: 'Increases maximum energy for abilities',
    },
    {
      name: 'Speed',
      key: 'speed',
      current: getSkillUpgradeLevel('speed', 'total'),
      goldLevels: getSkillUpgradeLevel('speed', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('speed', 'skillPoints'),
      icon: 'speedometer' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      description: 'Improves action speed and evasion',
    },
    {
      name: 'Luck',
      key: 'luck',
      current: getSkillUpgradeLevel('luck', 'total'),
      goldLevels: getSkillUpgradeLevel('luck', 'gold'),
      skillPointLevels: getSkillUpgradeLevel('luck', 'skillPoints'),
      icon: 'star' as keyof typeof Ionicons.glyphMap,
      color: '#ec4899',
      description: 'Increases critical hit chance and rare drops',
    },
  ];

  const handleBulkUpgrade = (skillKey: string, skill: any) => {
    const { cost, quantity, type } = calculateUpgradeCost(skill, upgradeQuantity);
    
    if (quantity === 0) {
      return; // Cannot afford any upgrades
    }

    console.log(`🚀 BULK ${type} UPGRADE: ${skillKey} x${quantity} for ${cost} ${type.toLowerCase()}`);
    
    // Initialize separate stat pools if they don't exist (backward compatibility)
    const baseStats = ninja.baseStats || {
      attack: ninja.attack,
      defense: ninja.defense,
      speed: ninja.speed,
      luck: ninja.luck,
      maxHealth: ninja.maxHealth,
      maxEnergy: ninja.maxEnergy,
    };
    
    const goldUpgrades = ninja.goldUpgrades || {
      attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0,
    };
    
    const skillPointUpgrades = ninja.skillPointUpgrades || {
      attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0,
    };
    
    if (skillUpgradeType === 'skillPoints') {
      // Skill Point upgrades are MORE BENEFICIAL: 3x stat gain (15x for health/energy)
      const upgrade = quantity * (skillKey === 'maxHealth' || skillKey === 'maxEnergy' ? 15 : 3);
      
      const updatedNinja = {
        ...ninja,
        skillPoints: ninja.skillPoints - quantity,
        baseStats,
        goldUpgrades,
        skillPointUpgrades: {
          ...skillPointUpgrades,
          [skillKey]: skillPointUpgrades[skillKey as keyof typeof skillPointUpgrades] + upgrade,
        },
      };
      updateNinja(updatedNinja);
    } else {
      // Gold upgrades are LESS BENEFICIAL: 1x stat gain (10x for health/energy)
      const upgrade = quantity * (skillKey === 'maxHealth' || skillKey === 'maxEnergy' ? 10 : 1);
      
      const updatedNinja = {
        ...ninja,
        gold: ninja.gold - cost,
        baseStats,
        skillPointUpgrades,
        goldUpgrades: {
          ...goldUpgrades,
          [skillKey]: goldUpgrades[skillKey as keyof typeof goldUpgrades] + upgrade,
        },
      };
      updateNinja(updatedNinja);
    }
  };

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Basic Stats Display */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Character Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{effectiveStats.level}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Experience</Text>
            <Text style={styles.statValue}>{effectiveStats.experience} / {effectiveStats.experienceToNext}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Health</Text>
            <Text style={styles.statValue}>{effectiveStats.health} / {effectiveStats.maxHealth}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Energy</Text>
            <Text style={styles.statValue}>{effectiveStats.energy} / {effectiveStats.maxEnergy}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Attack</Text>
            <Text style={[styles.statValue, {color: '#ef4444'}]}>{effectiveStats.attack}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Defense</Text>
            <Text style={[styles.statValue, {color: '#3b82f6'}]}>{effectiveStats.defense}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={[styles.statValue, {color: '#f59e0b'}]}>{effectiveStats.speed}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Luck</Text>
            <Text style={[styles.statValue, {color: '#ec4899'}]}>{effectiveStats.luck}</Text>
          </View>
        </View>
      </View>

      {/* Resources Display */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>💰 Resources</Text>
        
        <View style={styles.resourcesGrid}>
          <View style={styles.resourceItem}>
            <Ionicons name="diamond" size={20} color="#fbbf24" />
            <Text style={styles.resourceText}>Gold: {ninja.gold.toLocaleString()}</Text>
          </View>

          <View style={styles.resourceItem}>
            <Ionicons name="trophy" size={20} color="#10b981" />
            <Text style={styles.resourceText}>Gems: {ninja.gems.toLocaleString()}</Text>
          </View>

          <View style={styles.resourceItem}>
            <Ionicons name="flash" size={20} color="#8b5cf6" />
            <Text style={styles.resourceText}>Skill Points: {ninja.skillPoints}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSkillsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>⚡ Skill Upgrades</Text>
      
      {/* Current Resources Display */}
      <View style={styles.resourceDisplay}>
        <View style={styles.resourceDisplayItem}>
          <Ionicons name="diamond" size={20} color={MythicTechColors.cosmicGold} />
          <Text style={styles.resourceDisplayText}>Gold: {ninja.gold.toLocaleString()}</Text>
        </View>
        <View style={styles.resourceDisplayItem}>
          <Ionicons name="flash" size={20} color={MythicTechColors.neonPurple} />
          <Text style={styles.resourceDisplayText}>Skill Points: {ninja.skillPoints}</Text>
        </View>
      </View>
      
      {/* Upgrade Type Toggle */}
      <View style={styles.upgradeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, skillUpgradeType === 'gold' && styles.toggleButtonActive]}
          onPress={() => setSkillUpgradeType('gold')}
        >
          <Ionicons name="diamond" size={18} color={skillUpgradeType === 'gold' ? MythicTechColors.cosmicGold : MythicTechColors.voidSilver} />
          <Text style={[styles.toggleText, skillUpgradeType === 'gold' && styles.toggleTextActive]}>Gold</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, skillUpgradeType === 'skillPoints' && styles.toggleButtonActive]}
          onPress={() => setSkillUpgradeType('skillPoints')}
        >
          <Ionicons name="flash" size={18} color={skillUpgradeType === 'skillPoints' ? MythicTechColors.neonPurple : MythicTechColors.voidSilver} />
          <Text style={[styles.toggleText, skillUpgradeType === 'skillPoints' && styles.toggleTextActive]}>Skill Points</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantitySelector}>
        <Text style={styles.quantitySelectorTitle}>Upgrade Quantity:</Text>
        <View style={styles.quantityButtons}>
          {([1, 10, 'max'] as const).map((qty) => (
            <TouchableOpacity
              key={qty}
              style={[styles.quantityButton, upgradeQuantity === qty && styles.quantityButtonActive]}
              onPress={() => setUpgradeQuantity(qty)}
            >
              <Text style={[styles.quantityButtonText, upgradeQuantity === qty && styles.quantityButtonTextActive]}>
                {qty === 'max' ? 'MAX' : `x${qty}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>
        {skillUpgradeType === 'gold' 
          ? 'Use gold for basic stat increases (1 stat point per level, 10 for health/energy)'
          : 'Use skill points for PREMIUM upgrades (3x more beneficial: 3 stat points per level, 15 for health/energy)'}
      </Text>
      
      {skills.map((skill) => {
        const { cost, quantity, type } = calculateUpgradeCost(skill, upgradeQuantity);
        const canAfford = quantity > 0;

        return (
          <View key={skill.key} style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <View style={styles.skillInfo}>
                <Ionicons name={skill.icon} size={24} color={skill.color} />
                <View style={styles.skillDetails}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillDescription}>{skill.description}</Text>
                </View>
              </View>
              
              <View style={styles.skillLevel}>
                <Text style={styles.skillLevelText}>Total: Lv. {skill.current}</Text>
                <Text style={styles.skillSubLevel}>
                  💰{skill.goldLevels} + ⚡{skill.skillPointLevels}
                </Text>
              </View>
            </View>

            <View style={styles.skillUpgrade}>
              <View style={styles.costInfo}>
                <Ionicons 
                  name={skillUpgradeType === 'gold' ? 'diamond' : 'flash'} 
                  size={16} 
                  color={skillUpgradeType === 'gold' ? MythicTechColors.cosmicGold : MythicTechColors.neonPurple} 
                />
                <Text style={[styles.costText, {color: canAfford ? MythicTechColors.success : MythicTechColors.error}]}>
                  {cost.toLocaleString()} {type === 'SP' ? 'SP' : 'Gold'}
                </Text>
                {quantity !== (upgradeQuantity === 'max' ? quantity : upgradeQuantity) && (
                  <Text style={styles.quantityText}>
                    ({quantity}x available)
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.upgradeButton, {opacity: canAfford ? 1 : 0.5}]}
                onPress={() => handleBulkUpgrade(skill.key, skill)}
                disabled={!canAfford}
              >
                <Ionicons name="arrow-up" size={16} color={MythicTechColors.white} />
                <Text style={styles.upgradeButtonText}>
                  +{quantity}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Resource Info */}
      <View style={styles.resourceInfo}>
        <Text style={styles.resourceInfoTitle}>💡 Upgrade Types</Text>
        <Text style={styles.resourceInfoText}>
          <Text style={{color: MythicTechColors.cosmicGold, fontWeight: 'bold'}}>Gold Upgrades:</Text> Permanent, larger stat increases. Cost scales with level.
        </Text>
        <Text style={styles.resourceInfoText}>
          <Text style={{color: MythicTechColors.neonPurple, fontWeight: 'bold'}}>Skill Point Upgrades:</Text> Smaller increases, fixed cost of 1 SP. Earned by leveling up (3 per level).
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Character</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#e5e7eb" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'stats' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('stats')}
        >
          <Ionicons 
            name="stats-chart" 
            size={20} 
            color={selectedTab === 'stats' ? MythicTechColors.accent : '#9ca3af'} 
          />
          <Text style={[styles.tabButtonText, selectedTab === 'stats' && styles.tabButtonTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'skills' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('skills')}
        >
          <Ionicons 
            name="flash" 
            size={20} 
            color={selectedTab === 'skills' ? MythicTechColors.accent : '#9ca3af'} 
          />
          <Text style={[styles.tabButtonText, selectedTab === 'skills' && styles.tabButtonTextActive]}>
            Skills
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'stats' ? renderStatsTab() : renderSkillsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: MythicTechColors.darkSpace,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: MythicTechColors.neonBlue,
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
    textShadowColor: MythicTechColors.neonBlue,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: MythicTechColors.shadowGrid,
    borderWidth: 1,
    borderColor: MythicTechColors.neonPurple,
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: MythicTechColors.shadowGrid,
    borderWidth: 1,
    borderColor: MythicTechColors.deepVoid,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: MythicTechColors.cosmicDark,
    borderWidth: 2,
    borderColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  tabButtonText: {
    color: MythicTechColors.voidSilver,
    fontSize: 16,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: MythicTechColors.neonCyan,
    textShadowColor: MythicTechColors.neonCyan,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MythicTechColors.neonCyan,
    marginBottom: 8,
    textShadowColor: MythicTechColors.neonCyan,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: MythicTechColors.voidSilver,
    marginBottom: 20,
    lineHeight: 22,
  },
  statsGrid: {
    gap: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MythicTechColors.deepVoid,
    shadowColor: MythicTechColors.neonPurple,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statLabel: {
    fontSize: 16,
    color: MythicTechColors.voidSilver,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: MythicTechColors.neonBlue,
    textShadowColor: MythicTechColors.neonBlue,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  resourceItem: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: MythicTechColors.cosmicDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MythicTechColors.neonPurple,
    gap: 10,
  },
  resourceText: {
    fontSize: 15,
    color: MythicTechColors.cosmicGold,
    fontWeight: '600',
  },
  skillItem: {
    marginBottom: 18,
    padding: 18,
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MythicTechColors.neonPurple,
    shadowColor: MythicTechColors.neonPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skillInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  skillDetails: {
    flex: 1,
  },
  skillName: {
    fontSize: 17,
    fontWeight: '700',
    color: MythicTechColors.neonBlue,
    marginBottom: 6,
    textShadowColor: MythicTechColors.neonBlue,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skillDescription: {
    fontSize: 14,
    color: MythicTechColors.voidSilver,
    lineHeight: 20,
  },
  skillLevel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: MythicTechColors.cosmicDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MythicTechColors.neonCyan,
  },
  skillLevelText: {
    fontSize: 13,
    color: MythicTechColors.neonCyan,
    fontWeight: '700',
    textShadowColor: MythicTechColors.neonCyan,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skillSubLevel: {
    fontSize: 11,
    color: MythicTechColors.voidSilver,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
  skillUpgrade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: MythicTechColors.deepVoid,
    borderRadius: 8,
  },
  costText: {
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: MythicTechColors.neonPurple,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  upgradeButtonText: {
    color: MythicTechColors.white,
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: MythicTechColors.darkSpace,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  upgradeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: MythicTechColors.deepVoid,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: MythicTechColors.shadowGrid,
    borderWidth: 1,
    borderColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
  },
  toggleTextActive: {
    color: MythicTechColors.neonCyan,
    textShadowColor: MythicTechColors.neonCyan,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resourceInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: MythicTechColors.cosmicDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue,
  },
  resourceInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MythicTechColors.neonBlue,
    marginBottom: 8,
  },
  resourceInfoText: {
    fontSize: 14,
    color: MythicTechColors.voidSilver,
    lineHeight: 20,
    marginBottom: 4,
  },
  resourceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    backgroundColor: MythicTechColors.cosmicDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue,
  },
  resourceDisplayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceDisplayText: {
    fontSize: 16,
    color: MythicTechColors.neonBlue,
    fontWeight: '600',
  },
  quantitySelector: {
    marginBottom: 16,
  },
  quantitySelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
    marginBottom: 10,
  },
  quantityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MythicTechColors.deepVoid,
    alignItems: 'center',
  },
  quantityButtonActive: {
    backgroundColor: MythicTechColors.neonPurple,
    borderColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  quantityButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
  },
  quantityButtonTextActive: {
    color: MythicTechColors.white,
    textShadowColor: MythicTechColors.darkSpace,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quantityText: {
    fontSize: 12,
    color: MythicTechColors.voidSilver,
    fontStyle: 'italic',
    marginLeft: 6,
  },
});

export default CharacterOverlay;