import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MythicTechColors } from '../theme/MythicTechTheme';
import { useGame } from '../contexts/GameContext';

interface RevivalOverlayProps {
  visible: boolean;
  onRevive: () => void;
  onDecline: () => void;
}

export const RevivalOverlay: React.FC<RevivalOverlayProps> = ({ visible, onRevive, onDecline }) => {
  const { gameState, updateNinja, saveOnEvent } = useGame();
  const [countdown, setCountdown] = useState(10);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Start countdown when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setCountdown(10);
      
      // Animate overlay appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onDecline(); // Auto-decline when countdown reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Reset animations when hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  const reviveTickets = gameState.ninja.reviveTickets || 0;
  const canRevive = reviveTickets > 0;

  console.log('🔴 REVIVAL OVERLAY RENDERING:', { visible, reviveTickets, canRevive, countdown });

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.modalContainer}>
        {/* Death Icon */}
        <View style={styles.deathIcon}>
          <Ionicons name="skull" size={60} color={MythicTechColors.crimsonRed} />
        </View>

        {/* Title */}
        <Text style={styles.title}>YOU DIED!</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your ninja has fallen in battle...
        </Text>

        {/* Countdown */}
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            Auto-respawn in: {countdown}s
          </Text>
        </View>

        {/* Revival Options */}
        <View style={styles.optionsContainer}>
          {canRevive ? (
            <TouchableOpacity 
              style={styles.reviveButton}
              onPress={onRevive}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={24} color={MythicTechColors.darkSpace} />
              <Text style={styles.reviveButtonText}>
                USE REVIVE TICKET
              </Text>
              <View style={styles.ticketIndicator}>
                <Ionicons name="ticket" size={16} color={MythicTechColors.divineGold} />
                <Text style={styles.ticketCount}>
                  {reviveTickets}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noTicketsContainer}>
              <Ionicons name="ticket-outline" size={24} color={MythicTechColors.voidSilver} />
              <Text style={styles.noTicketsText}>
                No Revive Tickets
              </Text>
              <Text style={styles.noTicketsSubtext}>
                Purchase from store to revive instantly
              </Text>
            </View>
          )}

          {/* Watch Ad Button - Real AdMob Integration */}
          <TouchableOpacity 
            style={styles.adButton}
            onPress={async () => {
              try {
                console.log('📺 Starting rewarded ad system...');
                
                // Check if we're in a production build (iOS/Android) vs development server
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  try {
                    console.log('📱 Production build detected - attempting real AdMob');
                    // Dynamic import only in production builds
                    const AdMobModule = await import('../services/AdMobService');
                    const { adMobService } = AdMobModule;
                    
                    if (adMobService.isServiceAvailable()) {
                      const success = await adMobService.showRewardedAd((ticketCount: number) => {
                        console.log(`🎫 AdMob reward: ${ticketCount} tickets`);
                        
                        updateNinja(prev => ({
                          ...prev,
                          reviveTickets: (prev.reviveTickets || 0) + ticketCount
                        }));
                        
                        setTimeout(() => saveOnEvent('ad_reward_revive_tickets'), 100);
                        
                        Alert.alert(
                          '🎉 Ad Reward!',
                          `You received ${ticketCount} revive tickets!\n\nTotal: ${(gameState.ninja.reviveTickets || 0) + ticketCount}`,
                          [{ text: 'Awesome!' }]
                        );
                      });
                      
                      if (success) return; // AdMob worked, exit function
                    }
                  } catch (error) {
                    console.log('🎯 AdMob failed, falling back to mock:', error.message);
                  }
                }
                
                // Fallback: Mock ad system for development/web or when AdMob fails
                console.log('🎯 Using mock ad system');
                Alert.alert('📺 Watching Ad', 'Loading advertisement...', [{ text: 'OK' }]);
                
                setTimeout(() => {
                  const ticketCount = 10;
                  console.log(`🎫 Mock ad reward: ${ticketCount} tickets`);
                  
                  updateNinja(prev => ({
                    ...prev,
                    reviveTickets: (prev.reviveTickets || 0) + ticketCount
                  }));
                  
                  setTimeout(() => saveOnEvent('ad_reward_revive_tickets'), 100);
                  
                  Alert.alert(
                    '🎉 Ad Complete!',
                    `You received ${ticketCount} revive tickets!\n\nTotal: ${(gameState.ninja.reviveTickets || 0) + ticketCount}`,
                    [{ text: 'Awesome!' }]
                  );
                }, 2000);
                
              } catch (error) {
                console.error('Ad button error:', error);
                Alert.alert(
                  'Error',
                  'Unable to show ad right now. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.adButtonText}>
              WATCH AD (+10 TICKETS)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Revive instantly to keep your progress, or wait to respawn at full health
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: MythicTechColors.darkSpace,
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MythicTechColors.crimsonRed,
    shadowColor: MythicTechColors.crimsonRed,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.5,
  },
  deathIcon: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MythicTechColors.crimsonRed,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: MythicTechColors.crimsonRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  countdownContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MythicTechColors.crimsonRed,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    // Removed gap: 15 - iOS flexbox bug with TouchableOpacity
  },
  reviveButton: {
    backgroundColor: MythicTechColors.neonCyan,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15, // Replace gap with explicit margin
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.5,
  },
  reviveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.darkSpace,
  },
  ticketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ticketCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: MythicTechColors.divineGold,
  },
  noTicketsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  noTicketsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.voidSilver,
    marginTop: 5,
  },
  noTicketsSubtext: {
    fontSize: 12,
    color: MythicTechColors.voidSilver,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  declineButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: MythicTechColors.voidSilver,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
  },
  adButton: {
    backgroundColor: MythicTechColors.divineGold, // Beautiful gold color
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15, // Maintain spacing
    minHeight: 48,
    width: '100%',
    shadowColor: MythicTechColors.divineGold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    borderWidth: 1,
    borderColor: MythicTechColors.cosmicGold,
  },
  adButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.darkSpace,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
    lineHeight: 16,
  },
});