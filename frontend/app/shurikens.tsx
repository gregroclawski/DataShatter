import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useGame } from '../src/contexts/GameContext';

export default function ShurikensScreen() {
  const { gameState, equipShuriken, addShuriken } = useGame();
  const { shurikens, ninja } = gameState;

  const openShurikenPack = () => {
    if (ninja.gems >= 10) {
      const rarities = ['common', 'rare', 'epic', 'legendary'];
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

      const newShuriken = {
        id: Date.now().toString(),
        name: names[randomRarity as keyof typeof names][Math.floor(Math.random() * 3)],
        rarity: randomRarity as 'common' | 'rare' | 'epic' | 'legendary',
        attack: attacks[randomRarity as keyof typeof attacks],
        level: 1,
        equipped: false,
      };

      addShuriken(newShuriken);
      Alert.alert('New Shuriken!', `You obtained a ${randomRarity} ${newShuriken.name}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 10 gems to open a shuriken pack.');
    }
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
        <Text style={styles.headerTitle}>Shurikens</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Pack Opening */}
        <TouchableOpacity style={styles.packButton} onPress={openShurikenPack}>
          <View style={styles.packButtonContent}>
            <Ionicons name="gift" size={24} color="#ffffff" />
            <Text style={styles.packButtonText}>Open Shuriken Pack (10 gems)</Text>
          </View>
        </TouchableOpacity>

        {/* Equipped Shuriken */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currently Equipped</Text>
          {shurikens.find(s => s.equipped) ? (
            <View style={styles.equippedCard}>
              <View style={styles.shurikenIcon}>
                <Ionicons name="flash" size={32} color="#ffffff" />
              </View>
              <View style={styles.shurikenInfo}>
                <Text style={styles.shurikenName}>{shurikens.find(s => s.equipped)!.name}</Text>
                <Text style={[styles.shurikenRarity, { color: getRarityColor(shurikens.find(s => s.equipped)!.rarity) }]}>
                  {shurikens.find(s => s.equipped)!.rarity.toUpperCase()}
                </Text>
                <Text style={styles.shurikenAttack}>Attack: {shurikens.find(s => s.equipped)!.attack}</Text>
              </View>
            </View>
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
          {shurikens.map((shuriken) => (
            <TouchableOpacity
              key={shuriken.id}
              style={styles.shurikenCard}
              onPress={() => {
                equipShuriken(shuriken.id);
                Alert.alert('Equipped!', `${shuriken.name} has been equipped.`);
              }}
            >
              <View style={styles.shurikenIcon}>
                <Ionicons name="flash" size={24} color="#ffffff" />
              </View>
              <View style={styles.shurikenInfo}>
                <Text style={styles.shurikenName}>{shuriken.name}</Text>
                <Text style={[styles.shurikenRarity, { color: getRarityColor(shuriken.rarity) }]}>
                  {shuriken.rarity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.shurikenStats}>
                <Text style={styles.shurikenAttack}>ATK: {shuriken.attack}</Text>
                <Text style={styles.shurikenLevel}>Lv.{shuriken.level}</Text>
                {shuriken.equipped && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  packButton: {
    margin: 20,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  packButtonContent: {
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
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  equippedCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
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
  shurikenCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  shurikenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shurikenInfo: {
    flex: 1,
  },
  shurikenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  shurikenRarity: {
    fontSize: 12,
    fontWeight: '600',
  },
  shurikenStats: {
    alignItems: 'flex-end',
  },
  shurikenAttack: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  shurikenLevel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});