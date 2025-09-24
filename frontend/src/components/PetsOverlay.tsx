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

const PetsOverlay = ({ onClose }: Props) => {
  const { gameState, addPet, setActivePet, updateNinja } = useGame();
  const { pets, ninja } = gameState;

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

  const adoptNewPet = () => {
    if (ninja.gems >= 20) {
      const petTypes = ['Dragon', 'Wolf', 'Eagle', 'Tiger', 'Phoenix', 'Shadow Cat', 'Spirit Fox'];
      const rarities = ['common', 'rare', 'epic', 'legendary'];
      
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      const randomType = petTypes[Math.floor(Math.random() * petTypes.length)];
      
      const baseStats = {
        common: { strength: Math.floor(Math.random() * 8) + 8 },
        rare: { strength: Math.floor(Math.random() * 13) + 12 },
        epic: { strength: Math.floor(Math.random() * 15) + 20 },
        legendary: { strength: Math.floor(Math.random() * 20) + 30 }
      };

      const newPet = {
        id: Date.now().toString(),
        name: `${randomRarity.charAt(0).toUpperCase() + randomRarity.slice(1)} ${randomType}`,
        type: randomType,
        level: 1,
        experience: 0,
        happiness: Math.floor(Math.random() * 40) + 40,
        strength: baseStats[randomRarity as keyof typeof baseStats].strength,
        active: pets.length === 0,
        rarity: randomRarity as 'common' | 'rare' | 'epic' | 'legendary',
      };

      addPet(newPet);
      updateNinja({ gems: ninja.gems - 20 });
      Alert.alert('New Pet Adopted!', `You adopted a ${randomRarity} ${randomType}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 20 gems to adopt a new pet.');
    }
  };

  const handleSetActive = (petId: string) => {
    setActivePet(petId);
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      Alert.alert('Active Pet Set!', `${pet.name} is now your active pet.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pets</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Adoption */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.adoptButton} onPress={adoptNewPet}>
            <View style={styles.adoptButtonContent}>
              <Ionicons name="heart-circle" size={32} color="#ffffff" />
              <Text style={styles.adoptButtonTitle}>Adopt New Pet</Text>
              <Text style={styles.adoptButtonSubtitle}>20 Gems</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Pet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Pet</Text>
          {pets.find(p => p.active) ? (
            <View style={styles.activePetCard}>
              <View style={[styles.petIcon, { backgroundColor: getRarityColor(pets.find(p => p.active)!.rarity) }]}>
                <Ionicons name={getPetIcon(pets.find(p => p.active)!.type)} size={32} color="#ffffff" />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pets.find(p => p.active)!.name}</Text>
                <Text style={[styles.petRarity, { color: getRarityColor(pets.find(p => p.active)!.rarity) }]}>
                  {pets.find(p => p.active)!.rarity.toUpperCase()}
                </Text>
                <View style={styles.petStatsRow}>
                  <Text style={styles.petStat}>STR: {pets.find(p => p.active)!.strength}</Text>
                  <Text style={styles.petStat}>Lv.{pets.find(p => p.active)!.level}</Text>
                  <Text style={styles.petStat}>❤️ {pets.find(p => p.active)!.happiness}%</Text>
                </View>
              </View>
            </View>
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
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.petCard, pet.active && styles.activePetBorder]}
                onPress={() => handleSetActive(pet.id)}
              >
                <View style={[styles.petIcon, { backgroundColor: getRarityColor(pet.rarity) }]}>
                  <Ionicons name={getPetIcon(pet.type)} size={24} color="#ffffff" />
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={[styles.petRarity, { color: getRarityColor(pet.rarity) }]}>
                    {pet.rarity.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.petStatsColumn}>
                  <Text style={styles.petStatSmall}>STR: {pet.strength}</Text>
                  <Text style={styles.petStatSmall}>Lv.{pet.level}</Text>
                  {pet.active && (
                    <Ionicons name="star" size={16} color="#f59e0b" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike" size={60} color="#6b7280" />
            <Text style={styles.emptyStateText}>No pets yet</Text>
            <Text style={styles.emptyStateSubtext}>Adopt your first pet companion!</Text>
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
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  adoptButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  adoptButtonContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  adoptButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  adoptButtonSubtitle: {
    fontSize: 14,
    color: '#c4b5fd',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  activePetCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
    marginBottom: 20,
  },
  noPetCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 20,
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
  petCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  activePetBorder: {
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  petIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  petRarity: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  petStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  petStat: {
    fontSize: 12,
    color: '#d1d5db',
  },
  petStatsColumn: {
    alignItems: 'flex-end',
  },
  petStatSmall: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PetsOverlay;