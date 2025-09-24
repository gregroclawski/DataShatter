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
import { Pet } from '../contexts/GameContext';

const PetScreen = () => {
  const { gameState, addPet, setActivePet, feedPet, trainPet } = useGame();
  const { pets, ninja } = gameState;
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showModal, setShowModal] = useState(false);

  const getPetIcon = (type: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Dragon': 'flame',
      'Wolf': 'paw',
      'Eagle': 'airplane',
      'Tiger': 'flash',
      'Phoenix': 'sunny',
      'Shadow Cat': 'eye',
      'Spirit Fox': 'leaf',
    };
    return icons[type] || 'heart';
  };

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

  const getHappinessColor = (happiness: number) => {
    if (happiness >= 80) return '#10b981';
    if (happiness >= 60) return '#f59e0b';
    if (happiness >= 40) return '#ef4444';
    return '#dc2626';
  };

  const handleSetActive = (pet: Pet) => {
    setActivePet(pet.id);
    Alert.alert('Active Pet Set!', `${pet.name} is now your active pet.`);
  };

  const handleFeedPet = (pet: Pet) => {
    if (ninja.gold >= 10) {
      feedPet(pet.id);
      Alert.alert('Pet Fed!', `${pet.name} is happy and well-fed!`);
    } else {
      Alert.alert('Insufficient Gold', 'You need 10 gold to feed your pet.');
    }
  };

  const handleTrainPet = (pet: Pet) => {
    if (ninja.gold >= 25) {
      trainPet(pet.id);
      Alert.alert('Training Complete!', `${pet.name} has gained experience and strength!`);
    } else {
      Alert.alert('Insufficient Gold', 'You need 25 gold to train your pet.');
    }
  };

  const adoptNewPet = () => {
    if (ninja.gems >= 20) {
      const petTypes = ['Dragon', 'Wolf', 'Eagle', 'Tiger', 'Phoenix', 'Shadow Cat', 'Spirit Fox'];
      const rarities = ['common', 'rare', 'epic', 'legendary'];
      const weights = [45, 35, 15, 5];
      
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      const randomType = petTypes[Math.floor(Math.random() * petTypes.length)];
      
      const baseStats = {
        common: { strength: Math.floor(Math.random() * 8) + 8 },
        rare: { strength: Math.floor(Math.random() * 13) + 12 },
        epic: { strength: Math.floor(Math.random() * 15) + 20 },
        legendary: { strength: Math.floor(Math.random() * 20) + 30 }
      };

      const newPet: Pet = {
        id: Date.now().toString(),
        name: `${randomRarity.charAt(0).toUpperCase() + randomRarity.slice(1)} ${randomType}`,
        type: randomType,
        level: 1,
        experience: 0,
        happiness: Math.floor(Math.random() * 40) + 40,
        strength: baseStats[randomRarity as keyof typeof baseStats].strength,
        active: pets.length === 0, // First pet is automatically active
        rarity: randomRarity as 'common' | 'rare' | 'epic' | 'legendary',
      };

      addPet(newPet);
      Alert.alert('New Pet Adopted!', `You adopted a ${randomRarity} ${randomType}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 20 gems to adopt a new pet.');
    }
  };

  const PetCard = ({ pet }: { pet: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => {
        setSelectedPet(pet);
        setShowModal(true);
      }}
    >
      <LinearGradient
        colors={getRarityGradient(pet.rarity)}
        style={styles.cardGradient}
      >
        {pet.active && (
          <View style={styles.activeBadge}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
        
        <View style={styles.petIcon}>
          <Ionicons name={getPetIcon(pet.type)} size={40} color="#ffffff" />
        </View>
        
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={[styles.petRarity, { color: getRarityColor(pet.rarity) }]}>
          {pet.rarity.toUpperCase()}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="fitness" size={16} color="#ef4444" />
            <Text style={styles.statText}>{pet.strength}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={16} color="#f59e0b" />
            <Text style={styles.statText}>Lv.{pet.level}</Text>
          </View>
        </View>
        
        <View style={styles.happinessBar}>
          <Text style={styles.happinessLabel}>Happiness</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${pet.happiness}%`, 
                    backgroundColor: getHappinessColor(pet.happiness) 
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={styles.happinessValue}>{pet.happiness}%</Text>
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
        <Text style={styles.headerTitle}>Pet Collection</Text>
        <Text style={styles.headerSubtitle}>Collect, train, and bond with your pets</Text>
        
        <TouchableOpacity style={styles.adoptButton} onPress={adoptNewPet}>
          <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.adoptButtonGradient}>
            <Ionicons name="heart-circle" size={24} color="#ffffff" />
            <Text style={styles.adoptButtonText}>Adopt Pet (20 gems)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Active Pet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Pet</Text>
        {pets.find(p => p.active) ? (
          <PetCard pet={pets.find(p => p.active)!} />
        ) : (
          <View style={styles.noPetCard}>
            <Ionicons name="heart-dislike" size={40} color="#6b7280" />
            <Text style={styles.noPetText}>No active pet</Text>
            <Text style={styles.noPetSubtext}>Adopt your first pet to get started</Text>
          </View>
        )}
      </View>

      {/* All Pets */}
      {pets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Pets ({pets.length})</Text>
          <View style={styles.petGrid}>
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </View>
        </View>
      )}

      {/* Pet Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPet && (
              <>
                <LinearGradient
                  colors={getRarityGradient(selectedPet.rarity)}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalIcon}>
                    <Ionicons name={getPetIcon(selectedPet.type)} size={60} color="#ffffff" />
                  </View>
                  <Text style={styles.modalTitle}>{selectedPet.name}</Text>
                  <Text style={[styles.modalRarity, { color: getRarityColor(selectedPet.rarity) }]}>
                    {selectedPet.rarity.toUpperCase()} {selectedPet.type}
                  </Text>
                </LinearGradient>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Level</Text>
                    <Text style={styles.modalStatValue}>{selectedPet.level}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Strength</Text>
                    <Text style={styles.modalStatValue}>{selectedPet.strength}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Experience</Text>
                    <Text style={styles.modalStatValue}>{selectedPet.experience}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>Happiness</Text>
                    <Text style={[styles.modalStatValue, { color: getHappinessColor(selectedPet.happiness) }]}>
                      {selectedPet.happiness}%
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {!selectedPet.active && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        handleSetActive(selectedPet);
                        setShowModal(false);
                      }}
                    >
                      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.modalButtonGradient}>
                        <Text style={styles.modalButtonText}>Set Active</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.modalButton, { opacity: ninja.gold >= 10 ? 1 : 0.5 }]}
                    onPress={() => {
                      handleFeedPet(selectedPet);
                      setShowModal(false);
                    }}
                    disabled={ninja.gold < 10}
                  >
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>Feed (10g)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, { opacity: ninja.gold >= 25 ? 1 : 0.5 }]}
                    onPress={() => {
                      handleTrainPet(selectedPet);
                      setShowModal(false);
                    }}
                    disabled={ninja.gold < 25}
                  >
                    <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>Train (25g)</Text>
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
  adoptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  adoptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  adoptButtonText: {
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
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  petCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  petIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  petRarity: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  happinessBar: {
    alignItems: 'center',
  },
  happinessLabel: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 4,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  happinessValue: {
    fontSize: 10,
    color: '#9ca3af',
  },
  noPetCard: {
    backgroundColor: '#374151',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  noPetText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  noPetSubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
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
    gap: 8,
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
    fontSize: 12,
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

export default PetScreen;