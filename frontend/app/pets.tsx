import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';

export default function PetsScreen() {
  const { gameState, addPet, setActivePet } = useGame();
  const { pets, ninja } = gameState;

  const adoptNewPet = () => {
    if (ninja.gems >= 20) {
      const petTypes = ['Dragon', 'Wolf', 'Eagle', 'Tiger', 'Phoenix', 'Shadow Cat'];
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
      Alert.alert('New Pet Adopted!', `You adopted a ${randomRarity} ${randomType}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 20 gems to adopt a new pet.');
    }
  };

  const getPetIcon = (type: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Dragon': 'flame',
      'Wolf': 'paw',
      'Eagle': 'airplane',
      'Tiger': 'flash',
      'Phoenix': 'sunny',
      'Shadow Cat': 'eye',
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerTitle}>Pets</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Adopt Button */}
        <TouchableOpacity style={styles.adoptButton} onPress={adoptNewPet}>
          <View style={styles.adoptButtonContent}>
            <Ionicons name="heart-circle" size={24} color="#ffffff" />
            <Text style={styles.adoptButtonText}>Adopt New Pet (20 gems)</Text>
          </View>
        </TouchableOpacity>

        {/* Active Pet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Pet</Text>
          {pets.find(p => p.active) ? (
            <View style={styles.activePetCard}>
              <View style={styles.petIcon}>
                <Ionicons name={getPetIcon(pets.find(p => p.active)!.type)} size={32} color="#ffffff" />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pets.find(p => p.active)!.name}</Text>
                <Text style={[styles.petRarity, { color: getRarityColor(pets.find(p => p.active)!.rarity) }]}>
                  {pets.find(p => p.active)!.rarity.toUpperCase()}
                </Text>
                <Text style={styles.petStats}>Strength: {pets.find(p => p.active)!.strength}</Text>
                <Text style={styles.petStats}>Level: {pets.find(p => p.active)!.level}</Text>
                <Text style={styles.petStats}>Happiness: {pets.find(p => p.active)!.happiness}%</Text>
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
                onPress={() => {
                  if (!pet.active) {
                    setActivePet(pet.id);
                    Alert.alert('Active Pet Set!', `${pet.name} is now your active pet.`);
                  }
                }}
              >
                <View style={styles.petIcon}>
                  <Ionicons name={getPetIcon(pet.type)} size={24} color="#ffffff" />
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={[styles.petRarity, { color: getRarityColor(pet.rarity) }]}>
                    {pet.rarity.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.petStatsColumn}>
                  <Text style={styles.petStatsSmall}>STR: {pet.strength}</Text>
                  <Text style={styles.petStatsSmall}>Lv.{pet.level}</Text>
                  {pet.active && (
                    <Ionicons name="star" size={16} color="#f59e0b" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  adoptButton: {
    margin: 20,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
  },
  adoptButtonContent: {
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
    paddingTop: 0,
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
  },
  noPetCard: {
    backgroundColor: '#374151',
    padding: 24,
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
    backgroundColor: '#8b5cf6',
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
  },
  petStats: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
  petStatsColumn: {
    alignItems: 'flex-end',
  },
  petStatsSmall: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 2,
  },
});