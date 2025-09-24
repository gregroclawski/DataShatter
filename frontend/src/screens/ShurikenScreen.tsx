import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';
import { Shuriken } from '../contexts/GameContext';

const ShurikenScreen = () => {
  const { gameState, equipShuriken, upgradeShuriken, addShuriken } = useGame();
  const { shurikens, ninja } = gameState;
  const [selectedShuriken, setSelectedShuriken] = useState<Shuriken | null>(null);
  const [showModal, setShowModal] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return ['#6b7280', '#4b5563'];
      case 'rare': return ['#3b82f6', '#1d4ed8'];
      case 'epic': return ['#8b5cf6', '#7c3aed'];
      case 'legendary': return ['#f59e0b', '#d97706'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  const handleEquip = (shuriken: Shuriken) => {
    equipShuriken(shuriken.id);
    Alert.alert('Equipped!', `${shuriken.name} has been equipped.`);
  };

  const handleUpgrade = (shuriken: Shuriken) => {
    const cost = 50 * shuriken.level;
    if (ninja.gold >= cost) {
      upgradeShuriken(shuriken.id);
      Alert.alert('Upgraded!', `${shuriken.name} has been upgraded to level ${shuriken.level + 1}!`);
    } else {
      Alert.alert('Insufficient Gold', `You need ${cost} gold to upgrade this shuriken.`);
    }
  };

  const openShurikenPack = () => {
    if (ninja.gems >= 10) {
      // Generate random shuriken
      const rarities = ['common', 'rare', 'epic', 'legendary'];
      const weights = [50, 30, 15, 5];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      const names = {
        common: ['Iron Shuriken', 'Training Star', 'Basic Blade'],
        rare: ['Silver Star', 'Wind Cutter', 'Shadow Blade'],
        epic: ['Dragon Fang', 'Lightning Strike', 'Void Piercer'],
        legendary: ['Celestial Edge', 'Demon Slayer', 'God Killer']
      };
      
      const attacks = {
        common: Math.floor(Math.random() * 10) + 5,
        rare: Math.floor(Math.random() * 15) + 12,
        epic: Math.floor(Math.random() * 20) + 20,
        legendary: Math.floor(Math.random() * 25) + 35
      };

      const newShuriken: Shuriken = {
        id: Date.now().toString(),
        name: names[randomRarity as keyof typeof names][Math.floor(Math.random() * 3)],
        rarity: randomRarity as 'common' | 'rare' | 'epic' | 'legendary',
        attack: attacks[randomRarity as keyof typeof attacks],
        level: 1,
        equipped: false,
      };

      addShuriken(newShuriken);
      // Deduct gems (this should be handled in the context)
      Alert.alert('New Shuriken!', `You obtained a ${randomRarity} ${newShuriken.name}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 10 gems to open a shuriken pack.');
    }
  };

  const ShurikenCard = ({ shuriken }: { shuriken: Shuriken }) => (
    <TouchableOpacity
      style={styles.shurikenCard}
      onPress={() => {
        setSelectedShuriken(shuriken);
        setShowModal(true);
      }}
    >
      <LinearGradient
        colors={getRarityGradient(shuriken.rarity)}
        style={styles.cardGradient}
      >
        {shuriken.equipped && (
          <View style={styles.equippedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.equippedText}>Equipped</Text>
          </View>
        )}
        
        <View style={styles.shurikenIcon}>
          <Ionicons name="flash" size={40} color="#ffffff" />
        </View>
        
        <Text style={styles.shurikenName}>{shuriken.name}</Text>
        <Text style={[styles.shurikenRarity, { color: getRarityColor(shuriken.rarity) }]}>
          {shuriken.rarity.toUpperCase()}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={16} color="#ef4444" />
            <Text style={styles.statText}>{shuriken.attack}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={16} color="#f59e0b" />
            <Text style={styles.statText}>Lv.{shuriken.level}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Shuriken Collection</Text>
        <Text style={styles.headerSubtitle}>Collect and upgrade your weapons</Text>
        
        <TouchableOpacity style={styles.packButton} onPress={openShurikenPack}>
          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.packButtonGradient}>
            <Ionicons name="gift" size={24} color="#ffffff" />
            <Text style={styles.packButtonText}>Open Pack (10 gems)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Equipped Shuriken */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currently Equipped</Text>
        {shurikens.find(s => s.equipped) ? (
          <ShurikenCard shuriken={shurikens.find(s => s.equipped)!} />
        ) : (
          <View style={styles.noEquippedCard}>
            <Ionicons name="flash-off" size={40} color="#6b7280" />
            <Text style={styles.noEquippedText}>No shuriken equipped</Text>
          </View>
        )}
      </View>

      {/* All Shurikens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collection ({shurikens.length})</Text>
        <View style={styles.shurikenGrid}>
          {shurikens.map((shuriken) => (
            <ShurikenCard key={shuriken.id} shuriken={shuriken} />
          ))}
        </View>
      </View>

      {/* Shuriken Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedShuriken && (
              <>
                <LinearGradient
                  colors={getRarityGradient(selectedShuriken.rarity)}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalIcon}>
                    <Ionicons name="flash" size={60} color="#ffffff" />
                  </View>
                  <Text style={styles.modalTitle}>{selectedShuriken.name}</Text>
                  <Text style={[styles.modalRarity, { color: getRarityColor(selectedShuriken.rarity) }]}>
                    {selectedShuriken.rarity.toUpperCase()}
                  </Text>
                </LinearGradient>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Attack Power</Text>
                    <Text style={styles.modalStatValue}>{selectedShuriken.attack}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Level</Text>
                    <Text style={styles.modalStatValue}>{selectedShuriken.level}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Upgrade Cost</Text>
                    <Text style={styles.modalStatValue}>{50 * selectedShuriken.level} Gold</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {!selectedShuriken.equipped && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        handleEquip(selectedShuriken);
                        setShowModal(false);
                      }}
                    >
                      <LinearGradient colors={['#10b981', '#059669']} style={styles.modalButtonGradient}>
                        <Text style={styles.modalButtonText}>Equip</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.modalButton, { opacity: ninja.gold >= (50 * selectedShuriken.level) ? 1 : 0.5 }]}
                    onPress={() => {
                      handleUpgrade(selectedShuriken);
                      setShowModal(false);
                    }}
                    disabled={ninja.gold < (50 * selectedShuriken.level)}
                  >
                    <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>Upgrade</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  packButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  packButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  packButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  shurikenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shurikenCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  equippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065f46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  equippedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  shurikenIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shurikenName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  shurikenRarity: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noEquippedCard: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  noEquippedText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  modalRarity: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalStats: {
    padding: 20,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default ShurikenScreen;