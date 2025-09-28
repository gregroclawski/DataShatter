import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEquipment } from '../contexts/EquipmentContext';
import { Equipment, EquipmentSlot, RARITY_CONFIG } from '../data/EquipmentData';

interface EquipmentOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const EquipmentOverlay: React.FC<EquipmentOverlayProps> = ({ visible, onClose }) => {
  const { 
    inventory, 
    totalStats, 
    equipItem, 
    unequipItem, 
    generateRandomEquipment,
    addToInventory,
    getInventorySpace,
    upgradeEquipment,
    getEquipmentUpgradeCost,
    canUpgrade
  } = useEquipment();
  
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'equipped' | 'inventory'>('equipped');

  // Test function to generate random equipment (for development)
  const handleGenerateTestEquipment = () => {
    const newEquipment = generateRandomEquipment();
    const success = addToInventory(newEquipment);
    
    if (success) {
      Alert.alert('Equipment Generated!', `Added ${newEquipment.name} (${newEquipment.rarity}) to inventory`);
    } else {
      Alert.alert('Inventory Full!', 'Cannot add more equipment');
    }
  };

  // Handle equipment interaction (equip/unequip)
  const handleEquipmentAction = (equipment: Equipment) => {
    const isEquipped = Object.values(inventory.equipped).some(item => item?.id === equipment.id);
    
    if (isEquipped) {
      unequipItem(equipment.slot);
    } else {
      // Fix: Pass fromInventory: true to properly remove item from inventory when equipping
      equipItem(equipment, true);
    }
  };

  // Handle equipment upgrade
  const handleUpgradeEquipment = (equipment: Equipment) => {
    const cost = getEquipmentUpgradeCost(equipment.id);
    Alert.alert(
      'Upgrade Equipment',
      `Upgrade ${equipment.name} to level ${equipment.level + 1} for ${cost} gold?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => {
            const success = upgradeEquipment(equipment.id, cost);
            if (success) {
              Alert.alert('Success!', `${equipment.name} upgraded to level ${equipment.level + 1}`);
            } else {
              Alert.alert('Failed!', 'Could not upgrade equipment');
            }
          }
        }
      ]
    );
  };

  // Render equipment slot
  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const equipment = inventory.equipped[slot];
    const slotNames = {
      [EquipmentSlot.HEAD]: 'Head',
      [EquipmentSlot.BODY]: 'Body', 
      [EquipmentSlot.WEAPON]: 'Weapon',
      [EquipmentSlot.ACCESSORY]: 'Accessory'
    };

    return (
      <View key={slot} style={styles.equipmentSlot}>
        <Text style={styles.slotLabel}>{slotNames[slot]}</Text>
        <TouchableOpacity 
          style={[
            styles.slotContainer,
            equipment && { borderColor: RARITY_CONFIG[equipment.rarity].color }
          ]}
          onPress={() => equipment && unequipItem(slot)}
        >
          {equipment ? (
            <View style={styles.equippedItem}>
              <Text style={styles.equipmentIcon}>{equipment.icon}</Text>
              <Text style={[styles.equipmentName, { color: RARITY_CONFIG[equipment.rarity].color }]}>
                {equipment.name}
              </Text>
              <Text style={styles.equipmentLevel}>Lv.{equipment.level}</Text>
              
              {/* Equipment stats display for equipped items */}
              <View style={styles.equippedItemStats}>
                {Object.entries(equipment.currentStats).map(([key, value]) => (
                  <Text key={key} style={styles.equippedStatText}>
                    {key}: +{value}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptySlot}>
              <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
              <Text style={styles.emptySlotText}>Empty</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render inventory item
  const renderInventoryItem = (equipment: Equipment, index?: number) => {
    return (
      <TouchableOpacity
        key={`${equipment.id}_${index}`}
        style={[
          styles.inventoryItem,
          { borderColor: RARITY_CONFIG[equipment.rarity].color }
        ]}
        onPress={() => handleEquipmentAction(equipment)}
        onLongPress={() => canUpgrade(equipment.id) && handleUpgradeEquipment(equipment)}
      >
        <Text style={styles.inventoryItemIcon}>{equipment.icon}</Text>
        <View style={styles.inventoryItemInfo}>
          <Text style={[styles.inventoryItemName, { color: RARITY_CONFIG[equipment.rarity].color }]}>
            {equipment.name}
          </Text>
          <Text style={styles.inventoryItemLevel}>Lv.{equipment.level}</Text>
          <View style={styles.inventoryItemStats}>
            {Object.entries(equipment.currentStats).map(([key, value]) => (
              <Text key={key} style={styles.statText}>
                {key}: +{value}
              </Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render stats summary
  const renderStatsPanel = () => (
    <View style={styles.statsPanel}>
      <Text style={styles.statsPanelTitle}>Equipment Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={16} color="#ef4444" />
          <Text style={styles.statValue}>Attack: +{totalStats.attack || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#10b981" />
          <Text style={styles.statValue}>HP: +{totalStats.hp || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="shield" size={16} color="#3b82f6" />
          <Text style={styles.statValue}>Defense: +{totalStats.defense || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.statValue}>Crit: +{totalStats.critChance || 0}%</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#8b5cf6" />
          <Text style={styles.statValue}>CDR: +{totalStats.cooldownReduction || 0}%</Text>
        </View>
      </View>
    </View>
  );

  return visible ? (
    <View style={[
      styles.container,
      {
        // MOBILE FIX: Use full available height with proper safe area handling
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16,
        minHeight: Platform.OS !== 'web' ? '90%' : '50%', // Increase mobile coverage
        maxHeight: Platform.OS !== 'web' ? '95%' : '80%', // Allow more height on mobile
      }
    ]}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipment</Text>
        <View style={styles.headerButtons}>
          {Platform.OS === 'web' && (
            <TouchableOpacity onPress={handleGenerateTestEquipment} style={styles.testButton}>
              <Ionicons name="gift" size={20} color="#10b981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#e5e7eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Panel */}
      {renderStatsPanel()}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'equipped' && styles.activeTab]}
          onPress={() => setSelectedTab('equipped')}
        >
          <Text style={[styles.tabText, selectedTab === 'equipped' && styles.activeTabText]}>
            Equipped
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'inventory' && styles.activeTab]}
          onPress={() => setSelectedTab('inventory')}
        >
          <Text style={[styles.tabText, selectedTab === 'inventory' && styles.activeTabText]}>
            Inventory ({getInventorySpace().used}/{getInventorySpace().total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {selectedTab === 'equipped' ? (
          <View style={styles.equippedContent}>
            <View style={styles.equipmentGrid}>
              {Object.values(EquipmentSlot).map(slot => renderEquipmentSlot(slot))}
            </View>
          </View>
        ) : (
          <View style={styles.inventoryContent}>
            {inventory.inventory.length === 0 ? (
              <View style={styles.emptyInventory}>
                <Ionicons name="cube-outline" size={48} color="#6b7280" />
                <Text style={styles.emptyInventoryText}>No equipment in inventory</Text>
                <Text style={styles.emptyInventorySubtext}>
                  Defeat bosses to get equipment drops!
                </Text>
              </View>
            ) : (
              inventory.inventory.map((equipment, index) => renderInventoryItem(equipment, index))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    // MOBILE FIX: Remove fixed maxHeight, let dynamic styling handle it
    // maxHeight: '80%', -- removed
    minHeight: '50%',
    // MOBILE FIX: Better flex behavior for full screen coverage
    flex: 1,
    pointerEvents: 'auto', // Ensure overlay content can receive clicks
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  statsPanel: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  statValue: {
    color: '#d1d5db',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#10b981',
  },
  content: {
    flex: 1,
  },
  equippedContent: {
    flex: 1,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  equipmentSlot: {
    width: '48%',
    marginBottom: 16,
  },
  slotLabel: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  slotContainer: {
    height: 120,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  equippedItem: {
    alignItems: 'center',
  },
  equipmentIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  equipmentName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  equipmentLevel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  emptySlot: {
    alignItems: 'center',
  },
  emptySlotText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  inventoryContent: {
    gap: 8,
  },
  inventoryItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  inventoryItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inventoryItemLevel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  inventoryItemStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statText: {
    fontSize: 10,
    color: '#10b981',
  },
  emptyInventory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyInventoryText: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyInventorySubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});