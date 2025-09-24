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
import { useGame } from '../contexts/GameContext';

interface Props {
  onClose: () => void;
}

const ShurikensOverlay = ({ onClose }: Props) => {
  const { gameState, equipShuriken, addShuriken, updateNinja } = useGame();
  const { shurikens, ninja } = gameState;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

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
      updateNinja({ gems: ninja.gems - 10 });
      Alert.alert('New Shuriken!', `You obtained a ${randomRarity} ${newShuriken.name}!`);
    } else {
      Alert.alert('Insufficient Gems', 'You need 10 gems to open a shuriken pack.');
    }
  };

  const handleEquip = (shurikenId: string) => {
    equipShuriken(shurikenId);
    const shuriken = shurikens.find(s => s.id === shurikenId);
    if (shuriken) {
      Alert.alert('Equipped!', `${shuriken.name} has been equipped.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shurikens</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Pack Opening */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.packButton} onPress={openShurikenPack}>
            <View style={styles.packButtonContent}>
              <Ionicons name="gift" size={32} color="#ffffff" />
              <Text style={styles.packButtonTitle}>Open Shuriken Pack</Text>
              <Text style={styles.packButtonSubtitle}>10 Gems</Text>
            </View>
          </TouchableOpacity>
        </View>

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
                <Text style={styles.shurikenStats}>
                  Attack: {shurikens.find(s => s.equipped)!.attack} | Level: {shurikens.find(s => s.equipped)!.level}
                </Text>
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
              style={[styles.shurikenCard, shuriken.equipped && styles.equippedBorder]}
              onPress={() => handleEquip(shuriken.id)}
            >
              <View style={[styles.shurikenIcon, { backgroundColor: getRarityColor(shuriken.rarity) }]}>
                <Ionicons name="flash" size={24} color="#ffffff" />
              </View>
              <View style={styles.shurikenInfo}>
                <Text style={styles.shurikenName}>{shuriken.name}</Text>
                <Text style={[styles.shurikenRarity, { color: getRarityColor(shuriken.rarity) }]}>
                  {shuriken.rarity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.shurikenStats}>
                <Text style={styles.statText}>ATK: {shuriken.attack}</Text>
                <Text style={styles.statText}>Lv.{shuriken.level}</Text>
                {shuriken.equipped && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {shurikens.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flash-off" size={60} color="#6b7280" />
              <Text style={styles.emptyStateText}>No shurikens yet</Text>
              <Text style={styles.emptyStateSubtext}>Open packs to get your first weapons!</Text>
            </View>
          )}
        </View>
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
  packButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  packButtonContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  packButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  packButtonSubtitle: {
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
  equippedCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    marginBottom: 20,
  },
  noEquippedCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 20,
  },
  noEquippedText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
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
  equippedBorder: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  shurikenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  shurikenStats: {
    alignItems: 'flex-end',
  },
  statText: {
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

export default ShurikensOverlay;