import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBoss } from '../contexts/BossContext';
import { useGame } from '../contexts/GameContext';
import { Boss, BossType, BossTier } from '../data/BossData';
import { RARITY_CONFIG } from '../data/EquipmentData';
import { BossBattleScreen } from './BossBattleScreen';

interface BossOverlayProps {
  visible: boolean;
  onClose: () => void;
  onStartBattle: (boss: Boss, tier: BossTier) => void;
}

export const BossOverlay: React.FC<BossOverlayProps> = ({ visible, onClose, onStartBattle }) => {
  const { 
    getAvailableBosses,
    getBossProgress,
    canFightBoss,
    fightBoss,
    getTicketsRemaining,
    getTimeUntilTicketRegen,
    addTestMaterials,
    dailyBossState
  } = useBoss();
  
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [selectedTier, setSelectedTier] = useState<BossTier | null>(null);
  const [isFighting, setIsFighting] = useState(false);
  const [battleScreenVisible, setBattleScreenVisible] = useState(false);
  const [currentBossBattle, setCurrentBossBattle] = useState<{boss: Boss, tier: BossTier} | null>(null);

  // Add safety check for ninja data availability
  const { gameState } = useGame();
  const ninja = gameState.ninja;

  const availableBosses = getAvailableBosses();
  const ticketsRemaining = getTicketsRemaining();

  // Format time remaining for ticket regen
  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Handle boss fight - launch dedicated battle screen
  const handleFightBoss = async (bossType: BossType, tier: number) => {
    if (!canFightBoss(bossType, tier)) {
      Alert.alert('Cannot Fight', 'Requirements not met or no tickets remaining');
      return;
    }

    const boss = availableBosses.find(b => b.id === bossType);
    const bossTier = boss?.tiers.find(t => t.tier === tier);
    
    if (!boss || !bossTier) {
      Alert.alert('Error', 'Boss or tier not found');
      return;
    }

    // Set up the boss battle screen
    setCurrentBossBattle({ boss, tier: bossTier });
    setBattleScreenVisible(true);
  };

  // Handle battle completion from the dedicated screen
  const handleBattleComplete = async (victory: boolean) => {
    setBattleScreenVisible(false);
    setCurrentBossBattle(null);
    
    if (!currentBossBattle) return;
    
    const { boss, tier } = currentBossBattle;
    
    // Consume ticket regardless of outcome
    setIsFighting(true);
    
    try {
      // Simulate the battle result for rewards (since the visual battle was just for show)
      const result = await fightBoss(boss.id, tier.tier);
      
      let alertMessage = result.message;
      if (result.victory) {
        alertMessage += `\n\n💰 Gold: +${result.rewards.gold}`;
        alertMessage += `\n⭐ XP: +${result.rewards.experience}`;
        
        if (result.rewards.equipment) {
          alertMessage += `\n⚔️ Equipment: ${result.rewards.equipment.name}`;
        }
        
        const materialRewards = Object.entries(result.rewards.materials)
          .filter(([_, quantity]) => quantity > 0)
          .map(([material, quantity]) => `${quantity}x ${material.replace('_', ' ')}`)
          .join(', ');
        
        if (materialRewards) {
          alertMessage += `\n🔸 Materials: ${materialRewards}`;
        }
      }
      
      Alert.alert(
        result.victory ? '🏆 Victory!' : '💀 Defeat',
        alertMessage,
        [{ text: 'OK', onPress: () => setSelectedTier(null) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Boss fight failed');
    } finally {
      setIsFighting(false);
    }
  };

  // Render boss card
  const renderBossCard = (boss: Boss) => {
    const progress = getBossProgress(boss.id);
    const bossProgress = dailyBossState.bossProgress[boss.id];
    
    return (
      <TouchableOpacity
        key={boss.id}
        style={styles.bossCard}
        onPress={() => setSelectedBoss(boss)}
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
            Highest Tier: {progress.highestTier}/5
          </Text>
          <Text style={styles.bossProgress}>
            Victories: {progress.totalVictories}
          </Text>
          <Text style={styles.bossProgress}>
            Unlocked: {bossProgress.unlockedTiers.join(', ')}/5
          </Text>
        </View>
        
        <Text style={styles.bossDescription}>{boss.description}</Text>
      </TouchableOpacity>
    );
  };

  // Render boss tier details
  const renderBossTier = (boss: Boss, tier: BossTier) => {
    const canFight = canFightBoss(boss.id, tier.tier);
    const isUnlocked = dailyBossState.bossProgress[boss.id].unlockedTiers.includes(tier.tier);
    
    return (
      <View key={tier.tier} style={[styles.tierCard, !isUnlocked && styles.lockedTier]}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>
            Tier {tier.tier}: {tier.name}
          </Text>
          {!isUnlocked && <Ionicons name="lock-closed" size={16} color="#6b7280" />}
        </View>
        
        <Text style={styles.tierRequirement}>
          Required Level: {tier.requiredLevel}
        </Text>
        
        <View style={styles.tierStats}>
          <Text style={styles.statText}>HP: {tier.stats.hp.toLocaleString()}</Text>
          <Text style={styles.statText}>ATK: {tier.stats.attack}</Text>
          <Text style={styles.statText}>DEF: {tier.stats.defense}</Text>
          <Text style={styles.statText}>Crit: {tier.stats.critChance}%</Text>
        </View>
        
        <View style={styles.tierAbilities}>
          <Text style={styles.abilitiesTitle}>Abilities:</Text>
          <Text style={styles.abilitiesText}>{tier.stats.abilities.join(', ')}</Text>
        </View>
        
        <View style={styles.tierRewards}>
          <Text style={styles.rewardsTitle}>Rewards:</Text>
          <Text style={styles.rewardText}>
            💰 {tier.rewards.goldMin}-{tier.rewards.goldMax} Gold
          </Text>
          <Text style={styles.rewardText}>
            ⭐ {tier.rewards.experienceMin}-{tier.rewards.experienceMax} XP
          </Text>
          <Text style={styles.rewardText}>⚔️ Guaranteed Equipment Drop</Text>
          
          {Object.entries(tier.rewards.materials).map(([material, range]) => (
            <Text key={material} style={styles.materialReward}>
              🔸 {range.min}-{range.max}x {material.replace('_', ' ')}
            </Text>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.fightButton,
            !canFight && styles.fightButtonDisabled
          ]}
          onPress={() => isUnlocked && canFight ? handleFightBoss(boss.id, tier.tier) : null}
          disabled={!canFight || isFighting}
        >
          <Text style={[styles.fightButtonText, !canFight && styles.fightButtonTextDisabled]}>
            {isFighting ? 'Fighting...' : 
             !isUnlocked ? 'Locked' :
             !canFight ? 'Cannot Fight' : 
             'Fight Boss'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render tickets info
  const renderTicketsInfo = () => (
    <View style={styles.ticketsContainer}>
      <View style={styles.ticketsHeader}>
        <Ionicons name="ticket" size={24} color="#10b981" />
        <Text style={styles.ticketsTitle}>Daily Boss Tickets</Text>
      </View>
      
      <View style={styles.ticketsInfo}>
        <Text style={styles.ticketsRemaining}>
          {ticketsRemaining}/5 Remaining
        </Text>
        {ticketsRemaining < 5 && (
          <Text style={styles.ticketsRegen}>
            Next reset: {formatTimeRemaining(getTimeUntilTicketRegen())}
          </Text>
        )}
      </View>
      
      <TouchableOpacity onPress={addTestMaterials} style={styles.testButton}>
        <Text style={styles.testButtonText}>🧪 Add Test Materials</Text>
      </TouchableOpacity>
    </View>
  );

  // Don't render if not visible
  if (!visible) {
    return null;
  }
  
  // Simple ninja check - just ensure basic data is available
  if (!ninja) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Boss Battles</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#e5e7eb" />
          </TouchableOpacity>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#e5e7eb', fontSize: 16 }}>Loading player data...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedBoss ? (selectedTier ? 'Boss Battle' : selectedBoss.name) : 'Boss Battles'}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              if (selectedTier) {
                setSelectedTier(null);
              } else if (selectedBoss) {
                setSelectedBoss(null);
              } else {
                onClose();
              }
            }} 
            style={styles.closeButton}
          >
            <Ionicons name={selectedBoss || selectedTier ? "arrow-back" : "close"} size={24} color="#e5e7eb" />
          </TouchableOpacity>
        </View>

        {/* Tickets Info */}
        {!selectedBoss && renderTicketsInfo()}

        <ScrollView style={styles.content}>
          {!selectedBoss ? (
            // Boss selection view
            <View style={styles.bossesContainer}>
              {availableBosses.map(boss => renderBossCard(boss))}
            </View>
          ) : (
            // Boss details view
            <View style={styles.bossDetails}>
              <View style={styles.bossDetailHeader}>
                <Text style={styles.bossDetailIcon}>{selectedBoss.icon}</Text>
                <View style={styles.bossDetailInfo}>
                  <Text style={styles.bossDetailName}>{selectedBoss.name}</Text>
                  <Text style={styles.bossDetailLocation}>{selectedBoss.location}</Text>
                  <Text style={styles.bossDetailElement}>{selectedBoss.element} Element</Text>
                </View>
              </View>
              
              <Text style={styles.bossDetailDescription}>{selectedBoss.description}</Text>
              
              <Text style={styles.tiersTitle}>Boss Tiers</Text>
              {selectedBoss.tiers.map(tier => renderBossTier(selectedBoss, tier))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Boss Battle Screen */}
      {currentBossBattle && (
        <BossBattleScreen
          visible={battleScreenVisible}
          boss={currentBossBattle.boss}
          tier={currentBossBattle.tier}
          onComplete={handleBattleComplete}
          onEscape={() => {
            setBattleScreenVisible(false);
            setCurrentBossBattle(null);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
    minHeight: '50%',
    pointerEvents: 'auto',
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
  closeButton: {
    padding: 4,
  },
  ticketsContainer: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ticketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 8,
  },
  ticketsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketsRemaining: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  ticketsRegen: {
    fontSize: 12,
    color: '#9ca3af',
  },
  testButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#10b981',
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  bossesContainer: {
    gap: 12,
  },
  bossCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
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
    color: '#e5e7eb',
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
    fontStyle: 'italic',
  },
  bossDetails: {
    gap: 16,
  },
  bossDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bossDetailIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  bossDetailInfo: {
    flex: 1,
  },
  bossDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  bossDetailLocation: {
    fontSize: 16,
    color: '#10b981',
    marginTop: 4,
  },
  bossDetailElement: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  bossDetailDescription: {
    fontSize: 14,
    color: '#d1d5db',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tiersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 8,
  },
  tierCard: {
    backgroundColor: '#4b5563',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  lockedTier: {
    opacity: 0.6,
    backgroundColor: '#374151',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  tierRequirement: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 8,
  },
  tierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  tierAbilities: {
    marginBottom: 8,
  },
  abilitiesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 2,
  },
  abilitiesText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  tierRewards: {
    marginBottom: 12,
  },
  rewardsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 11,
    color: '#10b981',
    marginBottom: 1,
  },
  materialReward: {
    fontSize: 11,
    color: '#8b5cf6',
    marginBottom: 1,
  },
  fightButton: {
    backgroundColor: '#ef4444',
    padding: 10,
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
});