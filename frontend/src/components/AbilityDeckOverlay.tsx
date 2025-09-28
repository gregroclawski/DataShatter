import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCombat } from '../contexts/CombatContext';
import { useGame } from '../contexts/GameContext';
import { Ability, AbilityRarity } from '../types/AbilityTypes';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AbilityDeckOverlay({ visible, onClose }: Props) {
  const { getDeck, getAvailableAbilities, equipAbility, upgradeAbility } = useCombat();
  const game = useGame();
  const deck = getDeck();
  const availableAbilities = getAvailableAbilities();

  const getRarityColor = (rarity: AbilityRarity): string => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const handleEquipAbility = (abilityId: string, slotIndex: number) => {
    if (equipAbility(abilityId, slotIndex)) {
      Alert.alert('Success', 'Ability equipped successfully!');
    } else {
      Alert.alert('Error', 'Failed to equip ability.');
    }
  };

  const handleUpgradeAbility = (abilityId: string) => {
    Alert.alert(
      'Upgrade Ability',
      'Are you sure you want to upgrade this ability?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => {
            if (upgradeAbility(abilityId)) {
              Alert.alert('Success', 'Ability upgraded!');
            } else {
              Alert.alert('Error', 'Cannot upgrade ability. Check requirements.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ability Deck</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Deck */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Deck (5 slots)</Text>
              <View style={styles.deckSlots}>
                {deck.slots.map((ability, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.deckSlot,
                      ability && { borderColor: getRarityColor(ability.rarity) },
                    ]}
                    onPress={() => {
                      if (ability) {
                        Alert.alert(
                          ability.name,
                          `${ability.description}\n\nLevel: ${ability.level}\nDamage: ${ability.stats.baseDamage}\nCooldown: ${ability.stats.cooldown}s`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Unequip',
                              onPress: () => handleEquipAbility('', index),
                            },
                          ]
                        );
                      }
                    }}
                  >
                    {ability ? (
                      <View style={styles.equippedAbility}>
                        <Text style={styles.abilityIcon}>{ability.icon}</Text>
                        <Text style={styles.abilityName}>{ability.name}</Text>
                        <Text style={[styles.abilityRarity, { color: getRarityColor(ability.rarity) }]}>
                          L{ability.level} • {ability.rarity}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyDeckSlot}>
                        <Ionicons name="add" size={32} color="#4b5563" />
                        <Text style={styles.emptySlotText}>Slot {index + 1}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Active Synergies */}
            {deck.activeSynergies.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Synergies</Text>
                {deck.activeSynergies.map((synergy) => (
                  <View key={synergy.id} style={styles.synergyCard}>
                    <View style={styles.synergyHeader}>
                      <Ionicons name="link" size={20} color="#8b5cf6" />
                      <Text style={styles.synergyName}>{synergy.name}</Text>
                    </View>
                    <Text style={styles.synergyDescription}>{synergy.description}</Text>
                    <View style={styles.synergyBonuses}>
                      {synergy.bonus.damageBonus && (
                        <Text style={styles.bonusText}>+{synergy.bonus.damageBonus}% Damage</Text>
                      )}
                      {synergy.bonus.cooldownReduction && (
                        <Text style={styles.bonusText}>-{synergy.bonus.cooldownReduction}% Cooldown</Text>
                      )}
                      {synergy.bonus.critChance && (
                        <Text style={styles.bonusText}>+{synergy.bonus.critChance}% Crit Chance</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Available Abilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Abilities</Text>
              {availableAbilities.map((ability) => (
                <View key={ability.id} style={styles.abilityCard}>
                  <View style={styles.abilityHeader}>
                    <Text style={styles.abilityIconLarge}>{ability.icon}</Text>
                    <View style={styles.abilityInfo}>
                      <Text style={styles.abilityNameLarge}>{ability.name}</Text>
                      <Text style={[styles.abilityRarityLarge, { color: getRarityColor(ability.rarity) }]}>
                        Level {ability.level} • {ability.rarity}
                      </Text>
                      <Text style={styles.abilityDescription}>{ability.description}</Text>
                    </View>
                  </View>

                  <View style={styles.abilityStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="flash" size={16} color="#ef4444" />
                      <Text style={styles.statText}>{ability.stats.baseDamage} dmg</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color="#3b82f6" />
                      <Text style={styles.statText}>{ability.stats.cooldown}s cd</Text>
                    </View>
                    {ability.stats.aoeRadius && (
                      <View style={styles.statItem}>
                        <Ionicons name="radio-button-on" size={16} color="#10b981" />
                        <Text style={styles.statText}>{ability.stats.aoeRadius} aoe</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.abilityEffects}>
                    {ability.effects.map((effect) => (
                      <View key={effect} style={styles.effectTag}>
                        <Text style={styles.effectText}>{effect}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.abilityActions}>
                    {/* Equip buttons */}
                    <View style={styles.equipButtons}>
                      {[0, 1, 2, 3, 4].map((slotIndex) => (
                        <TouchableOpacity
                          key={slotIndex}
                          style={[
                            styles.equipBtn,
                            deck.slots[slotIndex] && styles.occupiedSlot,
                          ]}
                          onPress={() => handleEquipAbility(ability.id, slotIndex)}
                        >
                          <Text style={styles.equipBtnText}>
                            {slotIndex + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Upgrade button and requirements */}
                    {ability.level < ability.maxLevel && (
                      <View style={styles.upgradeSection}>
                        {(() => {
                          const nextUpgrade = ability.upgrades.find(u => u.level === ability.level + 1);
                          if (!nextUpgrade) return null;
                          
                          return (
                            <View style={styles.upgradeContainer}>
                              <View style={styles.upgradeRequirements}>
                                <Text style={styles.upgradeRequirementsTitle}>
                                  Upgrade to Level {ability.level + 1}:
                                </Text>
                                <View style={styles.costContainer}>
                                  <Ionicons name="logo-bitcoin" size={14} color="#f59e0b" />
                                  <Text style={styles.costText}>{nextUpgrade.cost.gold.toLocaleString()} Gold</Text>
                                </View>
                                {nextUpgrade.cost.materials && Object.entries(nextUpgrade.cost.materials).map(([material, amount]) => (
                                  <View key={material} style={styles.costContainer}>
                                    <Ionicons name="diamond" size={14} color="#8b5cf6" />
                                    <Text style={styles.costText}>{amount} {material}</Text>
                                  </View>
                                ))}
                                <View style={styles.upgradePreview}>
                                  <Text style={styles.upgradePreviewText}>
                                    +{Math.round((nextUpgrade.damageMultiplier - 1) * 100)}% Damage, 
                                    -{nextUpgrade.cooldownReduction}% Cooldown
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={styles.upgradeBtn}
                                onPress={() => handleUpgradeAbility(ability.id)}
                              >
                                <Ionicons name="arrow-up" size={16} color="#ffffff" />
                                <Text style={styles.upgradeBtnText}>Upgrade</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
    marginTop: 20,
  },
  deckSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deckSlot: {
    width: '18%',
    aspectRatio: 0.8,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4b5563',
    padding: 8,
  },
  equippedAbility: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilityIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  abilityName: {
    fontSize: 8,
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 2,
  },
  abilityRarity: {
    fontSize: 6,
    textAlign: 'center',
  },
  emptyDeckSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 8,
    color: '#4b5563',
    marginTop: 4,
  },
  synergyCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  synergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  synergyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginLeft: 8,
  },
  synergyDescription: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 8,
  },
  synergyBonuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bonusText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  abilityCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  abilityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  abilityIconLarge: {
    fontSize: 32,
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  abilityInfo: {
    flex: 1,
  },
  abilityNameLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  abilityRarityLarge: {
    fontSize: 12,
    marginBottom: 4,
  },
  abilityDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  abilityStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 4,
  },
  abilityEffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  effectTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  effectText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  abilityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  equipBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#4b5563',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  occupiedSlot: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  equipBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  upgradeSection: {
    flex: 1,
  },
  upgradeContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  upgradeRequirements: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  upgradeRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  costText: {
    fontSize: 11,
    color: '#d1d5db',
    marginLeft: 6,
  },
  upgradePreview: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  upgradePreviewText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
  },
});