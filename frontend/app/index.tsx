import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import SkillsOverlay from '../src/components/SkillsOverlay';
import StoreOverlay from '../src/components/StoreOverlay';
import CombatUI from '../src/components/CombatUI';
import AbilityDeckOverlay from '../src/components/AbilityDeckOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 250; // Leave space for bottom tabs
const NINJA_SIZE = 40;
const ENEMY_SIZE = 35;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'raids' | null;

export default function NinjaIdleGame() {
  const { gameState, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat } = useCombat();
  
  const ninja = gameState?.ninja;
  
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);

  const insets = useSafeAreaInsets();

  // Level-up explosion attack
  const triggerLevelUpExplosion = useCallback(() => {
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, []);

  // Watch for level changes to trigger explosion
  useEffect(() => {
    if (ninja && ninja.level > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', ninja.level);
      triggerLevelUpExplosion();
      setPreviousLevel(ninja.level);
    }
  }, [ninja?.level, previousLevel, triggerLevelUpExplosion]);

  // Start combat when component mounts
  useEffect(() => {
    startCombat();
    return () => stopCombat();
  }, []);

  const handleAbilityPress = (slotIndex: number) => {
    setShowAbilityDeck(true);
  };

  const bottomTabs = [
    { id: 'stats', name: 'Stats', icon: 'person' },
    { id: 'abilities', name: 'Abilities', icon: 'flash' },
    { id: 'pets', name: 'Pets', icon: 'heart' },
    { id: 'skills', name: 'Skills', icon: 'barbell' },
    { id: 'store', name: 'Store', icon: 'storefront' },
    { id: 'raids', name: 'Raids', icon: 'nuclear' },
  ];

  // Show loading if ninja data isn't available
  if (!ninja) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading Game Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top UI Bar */}
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.levelText}>Level {ninja.level}</Text>
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <View 
                style={[
                  styles.xpBar, 
                  { width: `${(ninja.experience / ninja.experienceToNext) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>{ninja.experience}/{ninja.experienceToNext} XP</Text>
          </View>
        </View>
        
        <View style={styles.resources}>
          <View style={styles.resourceItem}>
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text style={styles.resourceText}>{ninja.health}/{ninja.maxHealth}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
            <Text style={styles.resourceText}>{ninja.gold}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="diamond" size={16} color="#3b82f6" />
            <Text style={styles.resourceText}>{ninja.gems}</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Combat Status */}
        <View style={styles.combatStatus}>
          <Text style={styles.stageText}>
            Tick: {combatState.currentTick} | Enemies: {combatState.enemies.length}
          </Text>
          <Text style={[styles.combatText, { 
            color: combatState.isInCombat ? '#10b981' : '#ef4444' 
          }]}>
            {combatState.isInCombat ? 'In Combat' : 'Paused'}
          </Text>
        </View>

        {/* Battle Arena */}
        <View style={styles.battleArena}>
          {/* Ninja Character - Fixed position for new system */}
          <View
            style={[
              styles.ninja,
              {
                left: SCREEN_WIDTH / 2 - NINJA_SIZE / 2,
                top: GAME_AREA_HEIGHT / 2 - NINJA_SIZE / 2,
              },
              isLevelingUp && styles.ninjaLevelingUp,
            ]}
          >
            <Ionicons name="person" size={30} color="#8b5cf6" />
            {isLevelingUp && (
              <View style={styles.explosionEffect}>
                <Ionicons name="flash" size={60} color="#fbbf24" />
              </View>
            )}
          </View>

          {/* Enemies from Combat System */}
          {combatState.enemies.map((enemy) => (
            <View
              key={enemy.id}
              style={[
                styles.enemy,
                {
                  left: enemy.position.x,
                  top: enemy.position.y,
                },
              ]}
            >
              <Ionicons name="skull" size={24} color="#ef4444" />
              
              {/* Enemy Health Bar */}
              <View style={styles.enemyHealthBarContainer}>
                <View style={styles.enemyHealthBarBackground}>
                  <View 
                    style={[
                      styles.enemyHealthBar, 
                      { width: `${(enemy.health / enemy.maxHealth) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Combat UI - New ability system */}
      <CombatUI onAbilityPress={handleAbilityPress} />

      {/* Bottom Navigation */}
      <View style={styles.bottomTabs}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => {
              if (tab.id === 'abilities') {
                setShowAbilityDeck(true);
              } else {
                setActiveOverlay(tab.id as ActiveOverlay);
              }
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeOverlay === tab.id ? '#8b5cf6' : '#9ca3af'} 
            />
            <Text style={[
              styles.tabText,
              { color: activeOverlay === tab.id ? '#8b5cf6' : '#9ca3af' }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlays */}
      {activeOverlay && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.overlayContainer}>
            {activeOverlay === 'stats' && <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'pets' && <PetsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'skills' && <SkillsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'store' && <StoreOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'raids' && (
              <View style={styles.comingSoonOverlay}>
                <Ionicons name="construct" size={60} color="#8b5cf6" />
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                  Raid battles will be available in the next update.
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setActiveOverlay(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Ability Deck Overlay */}
      <AbilityDeckOverlay
        visible={showAbilityDeck}
        onClose={() => setShowAbilityDeck(false)}
      />
    </SafeAreaView>
  );

  // Level-up explosion attack
  const triggerLevelUpExplosion = useCallback(() => {
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    
    // In the new system, we could trigger a special ability or clear enemies
    // This would be handled by the combat system
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, []);

  // Watch for level changes to trigger explosion
  useEffect(() => {
    if (ninja.level > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', ninja.level);
      triggerLevelUpExplosion();
      setPreviousLevel(ninja.level);
    }
  }, [ninja.level, previousLevel, triggerLevelUpExplosion]);

  // Start combat when component mounts
  useEffect(() => {
    startCombat();
    return () => stopCombat();
  }, []);

  const bottomTabs = [
    { id: 'stats', name: 'Stats', icon: 'person' },
    { id: 'pets', name: 'Pets', icon: 'heart' },
    { id: 'skills', name: 'Skills', icon: 'barbell' },
    { id: 'store', name: 'Store', icon: 'storefront' },
    { id: 'raids', name: 'Raids', icon: 'nuclear' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Stats Bar */}
      <View style={styles.topStatsBar}>
        <View style={styles.topStat}>
          <Ionicons name="person" size={16} color="#8b5cf6" />
          <Text style={styles.topStatText}>Lv.{ninja.level}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="heart" size={16} color="#ef4444" />
          <Text style={styles.topStatText}>{ninja.health}/{ninja.maxHealth}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
          <Text style={styles.topStatText}>{ninja.gold}</Text>
        </View>
        <View style={styles.topStat}>
          <Ionicons name="diamond" size={16} color="#3b82f6" />
          <Text style={styles.topStatText}>{ninja.gems}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.stageText}>Stage {combatState.currentTick > 0 ? Math.floor(combatState.currentTick / 100) + 1 : 1}</Text>
        </View>
      </View>

      {/* Experience Bar */}
      <View style={styles.expBar}>
        <View style={styles.expBarHeader}>
          <Text style={styles.expBarLabel}>Level {ninja.level}</Text>
          <Text style={styles.expBarText}>{ninja.experience}/{ninja.experienceToNext} XP</Text>
        </View>
        <View style={styles.expBarContainer}>
          <View style={styles.expBarBg}>
            <View 
              style={[
                styles.expBarFill,
                { width: `${(ninja.experience / ninja.experienceToNext) * 100}%` }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Battle Arena */}
      <View style={styles.gameArea}>
        {/* Ninja Character */}
        <View
          style={[
            styles.ninja,
            {
              left: SCREEN_WIDTH / 2 - NINJA_SIZE / 2,
              top: GAME_AREA_HEIGHT / 2 - NINJA_SIZE / 2,
            },
            isLevelingUp && styles.ninjaLevelingUp,
          ]}
        >
          <Ionicons name="person" size={30} color="#8b5cf6" />
          {isLevelingUp && (
            <View style={styles.explosionEffect}>
              <Ionicons name="flash" size={60} color="#fbbf24" />
            </View>
          )}
        </View>

        {/* Enemies */}
        {combatState.enemies.map(enemy => (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                left: enemy.position.x,
                top: enemy.position.y,
                backgroundColor: '#ef4444', // Default red color for now
              },
            ]}
          >
            <Ionicons name="bug" size={25} color="#ffffff" />
            
            {/* Enemy Health Bar */}
            <View style={styles.enemyHealthBar}>
              <View 
                style={[
                  styles.enemyHealthFill,
                  { width: `${(enemy.health / enemy.maxHealth) * 100}%` }
                ]}
              />
            </View>
          </View>
        ))}

        {/* Attack Range Indicator - removed for new combat system */}
      </View>

      {/* Quick Action Bar */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionBtn, combatState.isInCombat && styles.activeButton]}
          onPress={() => combatState.isInCombat ? stopCombat() : startCombat()}
        >
          <Ionicons 
            name={combatState.isInCombat ? "pause" : "play"} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => {
            if (ninja.gems >= 5) {
              updateNinja({
                health: ninja.maxHealth,
                gems: ninja.gems - 5,
              });
            }
          }}
        >
          <Ionicons name="medical" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.enemyCounter}>
          <Text style={styles.enemyCounterText}>{combatState.enemies.length}/10</Text>
          <Text style={styles.killsText}>Tick {combatState.currentTick}</Text>
        </View>
      </View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomTabs}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeOverlay === tab.id && styles.activeTab]}
            onPress={() => setActiveOverlay(activeOverlay === tab.id ? null : tab.id as ActiveOverlay)}
          >
            <Ionicons 
              name={tab.icon as keyof typeof Ionicons.glyphMap} 
              size={20} 
              color={activeOverlay === tab.id ? "#8b5cf6" : "#9ca3af"} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeOverlay === tab.id ? "#8b5cf6" : "#9ca3af" }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlay Modals */}
      <Modal
        visible={activeOverlay !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveOverlay(null)}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            {activeOverlay === 'stats' && <NinjaStatsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'pets' && <PetsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'skills' && <SkillsOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'store' && <StoreOverlay onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === 'raids' && (
              <View style={styles.comingSoonOverlay}>
                <Ionicons name="construct" size={60} color="#8b5cf6" />
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                  Raid battles will be available in the next update.
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setActiveOverlay(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  topStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  topStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 4,
  },
  stageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  expBar: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  expBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expBarLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  expBarText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  expBarContainer: {
    width: '100%',
  },
  expBarBg: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  ninja: {
    position: 'absolute',
    width: NINJA_SIZE,
    height: NINJA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: NINJA_SIZE / 2,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  ninjaLevelingUp: {
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  explosionEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
    left: -20,
  },
  enemy: {
    position: 'absolute',
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ENEMY_SIZE / 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  enemyHealthBar: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  enemyHealthFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  attackRange: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  quickActionBtn: {
    backgroundColor: '#4b5563',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#8b5cf6',
  },
  enemyCounter: {
    flex: 1,
    alignItems: 'center',
  },
  enemyCounterText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  killsText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  comingSoonOverlay: {
    padding: 40,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // New styles for the updated UI
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  playerInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#9ca3af',
    minWidth: 80,
  },
  resources: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  combatStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  combatText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  battleArena: {
    flex: 1,
    position: 'relative',
  },
  enemyHealthBarContainer: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  enemyHealthBarBackground: {
    width: 30,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  enemyHealthBar: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});