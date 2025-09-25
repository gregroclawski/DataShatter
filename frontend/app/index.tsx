import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useGame } from '../src/contexts/GameContext';
import { useCombat } from '../src/contexts/CombatContext';
import { useZone } from '../src/contexts/ZoneContext';

// Import authentication components
import LoadingScreen from '../src/components/LoadingScreen';
import AuthScreen from '../src/components/AuthScreen';

// Import components for overlays
import NinjaStatsOverlay from '../src/components/NinjaStatsOverlay';
import PetsOverlay from '../src/components/PetsOverlay';
import SkillsOverlay from '../src/components/SkillsOverlay';
import StoreOverlay from '../src/components/StoreOverlay';
import { EnemiesZonesOverlay } from '../src/components/EnemiesZonesOverlay';
import { EquipmentOverlay } from '../src/components/EquipmentOverlay';
import { BossOverlay } from '../src/components/BossOverlay';
import { BossBattleScreen } from '../src/components/BossBattleScreen';
import CombatUI from '../src/components/CombatUI';
import AbilityDeckOverlay from '../src/components/AbilityDeckOverlay';
import { Boss, BossTier } from '../src/data/BossData';

import { MythicTechColors, CharacterProgressionNames } from '../src/theme/MythicTechTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mobile-optimized dimensions for iPhone 16 Pro Max (430x932)
const MOBILE_TOP_BAR_HEIGHT = 80;
const MOBILE_BOTTOM_NAV_HEIGHT = 90; // Increased for better touch targets
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - MOBILE_TOP_BAR_HEIGHT - MOBILE_BOTTOM_NAV_HEIGHT;
const NINJA_SIZE = 35; // Slightly smaller for mobile
const ENEMY_SIZE = 30;

type ActiveOverlay = 'stats' | 'pets' | 'skills' | 'store' | 'bosses' | 'zones' | 'equipment' | null;

export default function NinjaIdleGame() {
  console.log('🔄 COMPONENT RENDER - NinjaIdleGame mounting/re-rendering');
  
  // CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { gameState, isLoading: gameLoading, updateNinja } = useGame();
  const { combatState, startCombat, stopCombat, triggerLevelUpExplosion, projectiles, updateNinjaPosition } = useCombat();
  const { currentZone, currentZoneLevel, getZoneProgress, recordEnemyKill } = useZone();
  
  // Safe area insets hook (must be called before returns)
  const insets = useSafeAreaInsets();
  
  // All state hooks must be called unconditionally
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [lastExplosionTime, setLastExplosionTime] = useState(0);
  const [showAbilityDeck, setShowAbilityDeck] = useState(false);
  const [totalKills, setTotalKills] = useState(0);
  const [lastProcessedKill, setLastProcessedKill] = useState(0);
  
  // Boss battle state
  const [isBossBattleActive, setIsBossBattleActive] = useState(false);
  const [currentBossBattle, setCurrentBossBattle] = useState<{boss: Boss, tier: BossTier} | null>(null);
  const [previousOverlay, setPreviousOverlay] = useState<ActiveOverlay>(null);
  
  // Ninja position and movement state
  const [ninjaPosition, setNinjaPosition] = useState({
    x: 50,
    y: GAME_AREA_HEIGHT - NINJA_SIZE - 50
  });
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
  const [isAttacking, setIsAttacking] = useState(false);
  const [lastAttackTime, setLastAttackTime] = useState(0);

  // TEMPORARILY FIX useCallback dependencies to stop infinite loop
  const handleLevelUpExplosion = useCallback(() => {
    const now = Date.now();
    const EXPLOSION_COOLDOWN = 5000;
    
    if (now - lastExplosionTime < EXPLOSION_COOLDOWN) {
      console.log('💥 LEVEL UP EXPLOSION on cooldown, skipping...');
      return;
    }
    
    console.log('💥 LEVEL UP EXPLOSION!');
    setIsLevelingUp(true);
    setLastExplosionTime(now);
    
    triggerLevelUpExplosion();
    
    setTimeout(() => {
      setIsLevelingUp(false);
    }, 1000);
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  const startBossBattle = useCallback((boss: Boss, tier: BossTier) => {
    console.log('🐉 Starting boss battle:', boss.name, tier.name);
    setPreviousOverlay(activeOverlay);
    setActiveOverlay(null);
    setCurrentBossBattle({ boss, tier });
    setIsBossBattleActive(true);
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  const endBossBattle = useCallback(async (victory: boolean) => {
    console.log('🏆 Boss battle ended:', victory ? 'Victory' : 'Defeat');
    
    if (!currentBossBattle) return;
    
    setIsBossBattleActive(false);
    setCurrentBossBattle(null);
    
    if (previousOverlay === 'bosses') {
      setActiveOverlay('bosses');
    }
    setPreviousOverlay(null);
    
    Alert.alert(
      victory ? '🏆 Victory!' : '💀 Defeat',
      victory 
        ? `You defeated ${currentBossBattle.tier.name}! Check the boss overlay for rewards.`
        : `${currentBossBattle.tier.name} was too powerful. Try again when stronger!`,
      [{ text: 'OK' }]
    );
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  const escapeBossBattle = useCallback(() => {
    console.log('🏃 Escaping boss battle');
    
    setIsBossBattleActive(false);
    setCurrentBossBattle(null);
    
    if (previousOverlay === 'bosses') {
      setActiveOverlay('bosses');
    }
    setPreviousOverlay(null);
  }, []); // EMPTY DEPS TO PREVENT INFINITE LOOP

  // TEMPORARILY DISABLE COMBAT START TO TEST RENDERING
  /*
  useEffect(() => {
    console.log('🎮 Starting combat on component mount');
    startCombat();
    
    return () => {
      console.log('🛑 Cleaning up combat on unmount');
      stopCombat();
    };
  }, []); // Empty array - run only once
  */
  
  // Level up detection - safe to use gameState.ninja with optional chaining
  useEffect(() => {
    const currentNinjaLevel = gameState?.ninja?.level;
    if (currentNinjaLevel && currentNinjaLevel > previousLevel) {
      console.log('🚀 Level up detected!', previousLevel, '->', currentNinjaLevel);
      handleLevelUpExplosion();
      setPreviousLevel(currentNinjaLevel);
    }
  }, [gameState?.ninja?.level]); // Safe dependency - no function references
  
  // Authentication flow - AFTER all hooks are declared
  if (authLoading) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (gameLoading) {
    return <LoadingScreen message="Loading your ninja profile..." />;
  }
  
  // Initialize ninja data AFTER all loading checks
  const ninja = gameState?.ninja;
  
  console.log('🎯 NINJA CHECK:', { 
    ninja: !!ninja, 
    gameState: !!gameState, 
    authLoading, 
    gameLoading, 
    isAuthenticated 
  });
  
  // TEMPORARILY BYPASS ninja check to test layout
  // Create default ninja if missing to test UI
  const testNinja = ninja || {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    gold: 100,
    gems: 10,
    skillPoints: 0
  };
  
  // Get current character progression based on level
  const getCharacterProgression = (level: number) => {
    if (level >= 15000) return CharacterProgressionNames[15000];
    if (level >= 10000) return CharacterProgressionNames[10000];
    if (level >= 5000) return CharacterProgressionNames[5000];
    return CharacterProgressionNames[1];
  };

  const currentProgression = testNinja ? getCharacterProgression(testNinja.level) : CharacterProgressionNames[1];

  // SIMPLIFIED RETURN FOR TESTING
  return (
    <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>🔴 MINIMAL TEST UI</Text>
      <Text style={{ color: 'white', fontSize: 16 }}>Level: {testNinja.level}</Text>
      <Text style={{ color: 'white', fontSize: 16 }}>XP: {testNinja.experience}</Text>
      <Text style={{ color: 'white', fontSize: 16 }}>Progression: {currentProgression.title}</Text>
    </View>
  );
          <View style={styles.resourceItem}>
