import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCombat } from '../contexts/CombatContext';
import { EquippedAbility } from '../types/AbilityTypes';

import { MythicTechColors } from '../theme/MythicTechTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onAbilityPress: (slotIndex: number) => void;
}

export default function CombatUI({ onAbilityPress }: Props) {
  const { combatState, getDeck } = useCombat();
  const deck = getDeck();

  // Memoize combat status style to prevent inline object recreation
  const combatStatusStyle = useMemo(() => ({
    color: combatState.isInCombat ? "#10b981" : "#6b7280"
  }), [combatState.isInCombat]);

  const formatCooldown = (ticks: number): string => {
    const seconds = Math.ceil(ticks / 10);
    return seconds > 0 ? `${seconds}s` : '';
  };

  const getCooldownPercentage = (ability: EquippedAbility): number => {
    if (ability.currentCooldown <= 0) return 0;
    
    const maxCooldown = ability.stats.cooldown * 10; // Convert to ticks
    return (ability.currentCooldown / maxCooldown) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Combat Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons name="skull" size={16} color="#ef4444" />
          <Text style={styles.statusText}>
            Enemies: {combatState.enemies.length}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name={combatState.isInCombat ? "play" : "pause"} size={16} color={combatState.isInCombat ? "#10b981" : "#6b7280"} />
          <Text style={[styles.statusText, { color: combatState.isInCombat ? "#10b981" : "#6b7280" }]}>
            {combatState.isInCombat ? "Combat" : "Paused"}
          </Text>
        </View>
      </View>

      {/* Ability Slots */}
      <View style={styles.abilityBar}>
        {deck.slots.map((ability, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.abilitySlot,
              !ability && styles.emptySlot,
              ability?.currentCooldown > 0 && styles.onCooldownSlot,
            ]}
            onPress={() => onAbilityPress(index)}
            disabled={!ability}
          >
            {ability ? (
              <View style={styles.abilityContent}>
                {/* Ability Icon */}
                <Text style={styles.abilityIcon}>{ability.icon}</Text>
                
                {/* Ability Level */}
                <Text style={styles.abilityLevel}>L{ability.level}</Text>
                
                {/* Cooldown Overlay */}
                {ability.currentCooldown > 0 && (
                  <>
                    <View 
                      style={[
                        styles.cooldownOverlay,
                        { height: `${getCooldownPercentage(ability)}%` }
                      ]} 
                    />
                    <Text style={styles.cooldownText}>
                      {formatCooldown(ability.currentCooldown)}
                    </Text>
                  </>
                )}
                
                {/* Ready indicator */}
                {ability.currentCooldown <= 0 && (
                  <View style={styles.readyIndicator} />
                )}
              </View>
            ) : (
              <View style={styles.emptySlotContent}>
                <Ionicons name="add" size={24} color="#4b5563" />
                <Text style={styles.emptySlotText}>Empty</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Synergies */}
      {deck.activeSynergies.length > 0 && (
        <View style={styles.synergiesContainer}>
          <Text style={styles.synergiesTitle}>Active Synergies:</Text>
          <View style={styles.synergiesList}>
            {deck.activeSynergies.map((synergy, index) => (
              <View key={synergy.id} style={styles.synergyChip}>
                <Ionicons name="link" size={12} color="#8b5cf6" />
                <Text style={styles.synergyText}>{synergy.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Position above bottom navigation tabs (90px height + 10px margin)
    left: 8,
    right: 8,
    backgroundColor: MythicTechColors.deepVoid + 'f0', // Semi-transparent neon-dark
    borderTopWidth: 1,
    borderTopColor: MythicTechColors.neonBlue + '88',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 100, // High elevation to ensure it's above other elements
    zIndex: 100,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4, // Reduced by 50% (was 8)
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#d1d5db',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  abilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2, // Reduced by 50% (was 4)
  },
  abilitySlot: {
    width: (SCREEN_WIDTH - 60 - 60) / 5, // Much smaller slots (50% reduction)
    height: 40, // Fixed height instead of aspect ratio for compactness
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 4, // Much smaller border radius
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue + '66',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  emptySlot: {
    borderColor: MythicTechColors.shadowGrid,
    backgroundColor: MythicTechColors.darkSpace,
  },
  onCooldownSlot: {
    borderColor: MythicTechColors.plasmaGlow,
    shadowColor: MythicTechColors.plasmaGlow,
  },
  abilityContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  abilityIcon: {
    fontSize: 16, // 50% smaller (was 20, originally 24)
  },
  abilityLevel: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  cooldownOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
  },
  cooldownText: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  readyIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  emptySlotContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 8,
    color: '#4b5563',
    marginTop: 2,
  },
  synergiesContainer: {
    marginTop: 2, // Reduced by 50% (was 4)
  },
  synergiesTitle: {
    fontSize: 10,
    color: '#8b5cf6',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  synergiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  synergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  synergyText: {
    fontSize: 9,
    color: '#8b5cf6',
    marginLeft: 2,
    fontWeight: '500',
  },
});