import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBoss } from '../contexts/BossContext';
import { useGame } from '../contexts/GameContext';
import { MythicTechColors } from '../theme/MythicTechTheme';
import { Boss, BossTier } from '../data/BossData';

interface BossOverlayProps {
  visible: boolean;
  onClose: () => void;
  onStartBossFight?: (bossId: number) => void;
}

export const BossOverlay: React.FC<BossOverlayProps> = ({ visible, onClose, onStartBossFight }) => {
  const {
    dailyBossState,
    canFightBoss,
    fightBoss,
    getAvailableBosses,
    getBossProgress,
    hasTickets,
    getTicketsRemaining,
  } = useBoss();
  
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [selectedTier, setSelectedTier] = useState<BossTier | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  // Memoize event handlers to prevent inline arrow function recreation
  const handleBossSelect = useCallback((boss: Boss) => {
    setSelectedBoss(boss);
  }, []);

  const handleFightBoss = useCallback((bossId: number, tier: number) => {
    fightBoss(bossId, tier);
  }, [fightBoss]);

  const handleCloseDetails = useCallback(() => {
    setSelectedBoss(null);
    setSelectedTier(null);
  }, []);

  // Add safety check for ninja data availability
  const { gameState } = useGame();
  const ninja = gameState.ninja;

  if (!ninja) {
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Boss Battles</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#e5e7eb" />
            </TouchableOpacity>
          </View>
        <View style={[styles.content, styles.loadingContent]}>
          <Text style={styles.loadingText}>Loading player data...</Text>
        </View>
        </View>
      </View>
    );
  }

  const availableBosses = getAvailableBosses();

  const renderBossCard = (boss: Boss) => {
    const progress = getBossProgress(boss.id);
    const bossProgress = dailyBossState.bossProgress[boss.id];
    
    return (
      <TouchableOpacity
        key={boss.id}
        style={styles.bossCard}
        onPress={() => handleBossSelect(boss)}
      >
        <View style={styles.bossHeader}>
          <Text style={styles.bossIcon}>{boss.icon}</Text>
          <View style={styles.bossInfo}>
            <Text style={styles.bossName}>{boss.name}</Text>
            <Text style={styles.bossLocation}>{boss.location}</Text>
            <Text style={styles.bossElement}>{boss.element} Element</Text>
          </View>
        </View>
        
        <View style={styles.bossStats}>
          <Text style={styles.bossProgress}>
            Defeated: {bossProgress?.defeated || 0} times
          </Text>
        </View>
        
        <Text style={styles.bossDescription}>
          {boss.description}
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiersContainer}>
          {boss.tiers.map((tier, index) => {
            const isUnlocked = ninja.level >= tier.requiredLevel;
            const canFight = isUnlocked && hasTickets() && canFightBoss(boss.id, tier.tier);
            
            return (
              <TouchableOpacity
                key={`${boss.id}-${tier.tier}`}
                style={[
                  styles.tierCard,
                  isUnlocked ? styles.tierCardUnlocked : styles.tierCardLocked,
                  canFight ? styles.tierCardCanFight : null
                ]}
                onPress={() => isUnlocked && canFight ? handleFightBoss(boss.id, tier.tier) : null}
                disabled={!canFight}
              >
                <Text style={styles.tierTitle}>Tier {tier.tier}</Text>
                <Text style={styles.tierLevel}>Req. Level {tier.requiredLevel}</Text>
                <Text style={styles.tierHealth}>HP: {tier.health.toLocaleString()}</Text>
                <Text style={styles.tierAttack}>ATK: {tier.attack.toLocaleString()}</Text>
                
                <View style={styles.tierRewards}>
                  <Text style={styles.tierRewardsTitle}>Rewards:</Text>
                  <Text style={styles.tierReward}>XP: {tier.rewards.xp.toLocaleString()}</Text>
                  <Text style={styles.tierReward}>Gold: {tier.rewards.gold.toLocaleString()}</Text>
                  {tier.rewards.materials && (
                    <Text style={styles.tierReward}>Materials: {tier.rewards.materials.amount}</Text>
                  )}
                </View>
                
                {!isUnlocked && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={16} color="#6b7280" />
                  </View>
                )}
                
                {isUnlocked && !canFight && (
                  <View style={styles.noTicketsOverlay}>
                    <Text style={styles.noTicketsText}>No Tickets</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Boss Battles</Text>
            <View style={styles.headerInfo}>
              <Ionicons name="ticket" size={16} color="#fbbf24" />
              <Text style={styles.ticketsText}>
                Tickets: {getTicketsRemaining()}/5
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCloseDetails}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#e5e7eb" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Challenge mighty bosses for epic rewards!</Text>
            
            {availableBosses.length > 0 ? (
              availableBosses.map(renderBossCard)
            ) : (
              <View style={styles.noBossesContainer}>
                <Text style={styles.noBossesText}>No bosses available at your current level.</Text>
                <Text style={styles.noBossesSubtext}>Keep leveling up to unlock boss battles!</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: '#374151',
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
    color: '#f9fafb',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketsText: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    textAlign: 'center',
  },
  bossCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  bossHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bossIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bossInfo: {
    flex: 1,
  },
  bossName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  bossLocation: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 2,
  },
  bossElement: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bossStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bossProgress: {
    fontSize: 12,
    color: '#d1d5db',
  },
  bossDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 18,
  },
  tiersContainer: {
    flexDirection: 'row',
  },
  tierCard: {
    backgroundColor: '#4b5563',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  tierCardUnlocked: {
    borderColor: '#10b981',
  },
  tierCardLocked: {
    opacity: 0.6,
  },
  tierCardCanFight: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 4,
  },
  tierLevel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
  },
  tierHealth: {
    fontSize: 11,
    color: '#ef4444',
    marginBottom: 2,
  },
  tierAttack: {
    fontSize: 11,
    color: '#f59e0b',
    marginBottom: 8,
  },
  tierRewards: {
    borderTopWidth: 1,
    borderTopColor: '#6b7280',
    paddingTop: 6,
  },
  tierRewardsTitle: {
    fontSize: 10,
    color: '#d1d5db',
    fontWeight: '600',
    marginBottom: 2,
  },
  tierReward: {
    fontSize: 10,
    color: '#a3a3a3',
    marginBottom: 1,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noTicketsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noTicketsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noBossesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBossesText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  noBossesSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  fightButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  fightButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  fightButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fightButtonTextDisabled: {
    color: '#9ca3af',
  },
  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e5e7eb',
    fontSize: 16,
  },
});