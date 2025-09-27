import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCombat } from '../contexts/CombatContext';
import { EquippedAbility } from '../types/AbilityTypes';
import { MythicTechColors } from '../theme/MythicTechTheme';

const CombatUI: React.FC = () => {
  const { combatState, useAbilityManually } = useCombat();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Get equipped abilities from combat state
  const deck = combatState.abilityManager.getDeck();
  
  // MOBILE DEBUG: Log equipped abilities to verify they're loading correctly
  React.useEffect(() => {
    console.log(`🎯 CombatUI - Equipped abilities check:`);
    deck.slots.forEach((ability, index) => {
      if (ability) {
        console.log(`  Slot ${index}: ${ability.name} (${ability.icon}) - Cooldown: ${ability.currentCooldown} ticks`);
      } else {
        console.log(`  Slot ${index}: empty`);
      }
    });
  }, [deck.slots]);

  // Calculate cooldown percentage for ability - FIXED: Use tick-based system consistently & optimized for mobile
  const getCooldownPercentage = useCallback((ability: EquippedAbility): number => {
    if (!ability.currentCooldown) return 0;
    
    // Convert ability cooldown from seconds to ticks (10 TPS)
    const totalCooldownTicks = Math.ceil(ability.stats.cooldown * 10);
    const remainingCooldown = ability.currentCooldown;
    
    if (remainingCooldown <= 0) return 0;
    return Math.max(0, remainingCooldown / totalCooldownTicks);
  }, []); // MOBILE PERFORMANCE: Removed currentTick dependency to prevent excessive re-renders

  // Dynamic styles for responsive circular layout
  const circularStyles = useMemo(() => {
    // Position in bottom-left corner with mobile-accessible touch targets
    const buttonSize = Math.max(44, Math.min(screenWidth * 0.1, 50)); // Minimum 44px for iOS accessibility
    const spacing = buttonSize * 0.3; // Proper spacing for touch targets
    const bottomOffset = 80; // Above bottom navigation with proper spacing
    const leftOffset = 15; // From left edge with proper margin

    return StyleSheet.create({
      // Container for circular abilities in bottom-left
      circularContainer: {
        position: 'absolute',
        bottom: bottomOffset,
        left: leftOffset,
        zIndex: 30, // Below game elements (ninja: 50, enemies: 45)
      },
      
      // Top row (3 abilities)
      topRow: {
        flexDirection: 'row',
        marginBottom: spacing,
      },
      
      // Bottom row (2 abilities, centered)
      bottomRow: {
        flexDirection: 'row',
        marginLeft: buttonSize * 0.5, // Center 2 buttons under 3 buttons
      },
      
      // Individual circular ability button
      abilityButton: {
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize / 2, // Perfect circle
        backgroundColor: MythicTechColors.shadowGrid,
        borderWidth: 2,
        borderColor: MythicTechColors.neonBlue + '88',
        marginHorizontal: spacing / 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Platform-specific shadows for depth
        ...(Platform.OS === 'ios' ? {
          shadowColor: MythicTechColors.neonBlue,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
        } : {
          elevation: 4,
        }),
      },
      
      // Ability level indicator
      abilityLevel: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: MythicTechColors.neonCyan,
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 16,
        alignItems: 'center',
      },
      
      // Level text
      levelText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: MythicTechColors.deepVoid,
      },
      
      // Cooldown overlay
      cooldownOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: MythicTechColors.crimsonRed + '77',
        justifyContent: 'center',
        alignItems: 'center',
      },
      
      // Combat status display (compact, top-left)
      statusContainer: {
        position: 'absolute',
        top: screenHeight * 0.15,
        left: 20,
        backgroundColor: MythicTechColors.deepVoid + 'f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: MythicTechColors.neonBlue + '66',
        zIndex: 25,
      },
      
      statusText: {
        color: MythicTechColors.neonCyan,
        fontSize: 12,
        fontWeight: '600',
      },
    });
  }, [screenWidth, screenHeight]);

  return (
    <>
      {/* Combat Status - Compact top-left display */}
      <View style={circularStyles.statusContainer}>
        <Text style={circularStyles.statusText}>
          {combatState.isInCombat ? 'Combat' : 'Idle'}
        </Text>
        <Text style={circularStyles.statusText}>
          Enemies: {combatState.enemies.length}
        </Text>
      </View>

      {/* Circular Abilities Layout - Bottom-left corner */}
      <View style={circularStyles.circularContainer}>
        {/* Top Row - 3 Abilities */}
        <View style={circularStyles.topRow}>
          {deck.slots.slice(0, 3).map((ability, index) => ability ? (
            <TouchableOpacity
              key={`ability-${index}`}
              style={circularStyles.abilityButton}
              onPress={() => {
                // Trigger ability manually if not on cooldown
                const cooldown = getCooldownPercentage(ability);
                if (cooldown === 0) {
                  console.log(`🔥 Manual ability ${ability.name} (slot ${index}) activated!`);
                  // Try to use manual ability casting if available, otherwise fallback
                  if (useAbilityManually) {
                    useAbilityManually(index);
                  } else {
                    console.log(`⚡ No manual casting function available for ${ability.name}`);
                  }
                } else {
                  console.log(`⏳ Ability ${ability.name} is on cooldown: ${(cooldown * 100).toFixed(1)}%`);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Ability Level Indicator */}
              <View style={circularStyles.abilityLevel}>
                <Text style={circularStyles.levelText}>
                  {ability.level || 1}
                </Text>
              </View>

              {/* Ability Icon */}
              <Text style={{ fontSize: 20 }}>
                {ability.icon || '⚡'}
              </Text>

              {/* Cooldown Overlay */}
              {(() => {
                const cooldownPercent = getCooldownPercentage(ability);
                return cooldownPercent > 0 ? (
                  <View
                    style={[
                      circularStyles.cooldownOverlay,
                      { height: `${cooldownPercent * 100}%` }
                    ]}
                  />
                ) : null;
              })()}
            </TouchableOpacity>
          ) : null)}
        </View>

        {/* Bottom Row - 2 Abilities (centered) */}
        <View style={circularStyles.bottomRow}>
          {deck.slots.slice(3, 5).map((ability, index) => ability ? (
            <TouchableOpacity
              key={`ability-${index + 3}`}
              style={circularStyles.abilityButton}
              onPress={() => {
                const cooldown = getCooldownPercentage(ability);
                if (cooldown === 0) {
                  const actualIndex = index + 3; // Bottom row starts at slot 3
                  console.log(`🔥 Manual ability ${ability.name} (slot ${actualIndex}) activated!`);
                  if (useAbilityManually) {
                    useAbilityManually(actualIndex);
                  } else {
                    console.log(`⚡ No manual casting function available for ${ability.name}`);
                  }
                } else {
                  console.log(`⏳ Ability ${ability.name} is on cooldown: ${(cooldown * 100).toFixed(1)}%`);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={circularStyles.abilityLevel}>
                <Text style={circularStyles.levelText}>
                  {ability.level || 1}
                </Text>
              </View>

              <Text style={{ fontSize: 20 }}>
                {ability.icon || '⚡'}
              </Text>

              {(() => {
                const cooldownPercent = getCooldownPercentage(ability);
                return cooldownPercent > 0 ? (
                  <View
                    style={[
                      circularStyles.cooldownOverlay,
                      { height: `${cooldownPercent * 100}%` }
                    ]}
                  />
                ) : null;
              })()}
            </TouchableOpacity>
          ) : null)}
        </View>
      </View>
    </>
  );
};

export default CombatUI;