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
  const { combatState } = useCombat();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Get equipped abilities from combat state
  const deck = combatState.abilityManager.getDeck();
  const equippedAbilities = deck.slots.filter(slot => slot !== null);

  // Calculate cooldown percentage for ability
  const getCooldownPercentage = useCallback((ability: EquippedAbility): number => {
    if (!ability.lastUsed) return 0;
    
    const now = combatState.currentTick;
    const elapsed = now - ability.lastUsed;
    const cooldownTime = ability.cooldown * 1000; // Convert to milliseconds
    
    if (elapsed >= cooldownTime) return 0;
    return Math.max(0, (cooldownTime - elapsed) / cooldownTime);
  }, [combatState.currentTick]);

  // Dynamic styles for responsive circular layout
  const circularStyles = useMemo(() => {
    // Position in bottom-left corner with proper spacing
    const buttonSize = Math.min(screenWidth * 0.12, 60); // Responsive size
    const spacing = buttonSize * 0.3; // Space between buttons
    const bottomOffset = 120; // Above bottom navigation
    const leftOffset = 20; // From left edge

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
          {equippedAbilities.slice(0, 3).map((ability, index) => (
            <TouchableOpacity
              key={`ability-${index}`}
              style={circularStyles.abilityButton}
              onPress={() => {
                // Trigger ability if not on cooldown
                const cooldown = getCooldownPercentage(ability);
                if (cooldown === 0) {
                  console.log(`🔥 Ability ${ability.id} activated!`);
                  // Add ability activation logic here
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
              <Ionicons
                name={ability.iconName || 'flash'}
                size={24}
                color={MythicTechColors.neonBlue}
              />

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
          ))}
        </View>

        {/* Bottom Row - 2 Abilities (centered) */}
        <View style={circularStyles.bottomRow}>
          {equippedAbilities.slice(3, 5).map((ability, index) => (
            <TouchableOpacity
              key={`ability-${index + 3}`}
              style={circularStyles.abilityButton}
              onPress={() => {
                const cooldown = getCooldownPercentage(ability);
                if (cooldown === 0) {
                  console.log(`🔥 Ability ${ability.id} activated!`);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={circularStyles.abilityLevel}>
                <Text style={circularStyles.levelText}>
                  {ability.level || 1}
                </Text>
              </View>

              <Ionicons
                name={ability.iconName || 'flash'}
                size={24}
                color={MythicTechColors.neonBlue}
              />

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
          ))}
        </View>
      </View>
    </>
  );
};

export default CombatUI;