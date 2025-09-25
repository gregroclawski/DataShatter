import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MythicTechColors } from '../theme/MythicTechTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Initializing Neural Grid...' }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulsing orb animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Glitch effect animation
    const glitchAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glitchAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      glitchAnimation.stop();
    };
  }, [fadeAnim, pulseAnim, rotateAnim, glitchAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glitchTranslate = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  return (
    <LinearGradient
      colors={[MythicTechColors.darkSpace, MythicTechColors.deepVoid, MythicTechColors.shadowGrid]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: glitchTranslate }],
          },
        ]}
      >
        {/* Central Energy Orb */}
        <View style={styles.orbContainer}>
          <Animated.View
            style={[
              styles.outerOrb,
              {
                transform: [
                  { scale: pulseAnim },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <View style={styles.outerRing} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.innerOrb,
              {
                transform: [
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[MythicTechColors.neonBlue, MythicTechColors.neonPurple, MythicTechColors.neonCyan]}
              style={styles.orbGradient}
            />
          </Animated.View>

          {/* Rotating rings */}
          <Animated.View
            style={[
              styles.rotatingRing,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: 1.5 },
                ],
              },
            ]}
          />
          
          <Animated.View
            style={[
              styles.rotatingRing,
              styles.secondaryRing,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: 2 },
                ],
              },
            ]}
          />
        </View>

        {/* Main Title */}
        <Animated.View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>MYTHIC-TECH</Text>
          <Text style={styles.subtitle}>IDLE RPG</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.tagline}>
            Where Ancient Power Meets Digital Evolution
          </Text>
        </Animated.View>

        {/* Loading Message */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{message}</Text>
          
          {/* Loading Bar */}
          <View style={styles.loadingBarContainer}>
            <View style={styles.loadingBarBackground}>
              <Animated.View
                style={[
                  styles.loadingBarFill,
                  {
                    transform: [{ scaleX: pulseAnim }],
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Floating Particles */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: `${20 + index * 15}%`,
                  top: `${30 + (index % 3) * 20}%`,
                  transform: [
                    { 
                      translateY: pulseAnim.interpolate({
                        inputRange: [0.5, 1.2],
                        outputRange: [0, -10],
                      })
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  orbContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  outerOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    borderWidth: 2,
    borderColor: MythicTechColors.neonBlue,
    backgroundColor: 'transparent',
  },
  innerOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 40,
  },
  rotatingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: MythicTechColors.neonPurple + '66',
    backgroundColor: 'transparent',
  },
  secondaryRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: MythicTechColors.neonCyan + '44',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
    textShadowColor: MythicTechColors.neonBlue + '88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 4,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MythicTechColors.neonPurple,
    textShadowColor: MythicTechColors.neonPurple + '88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
    marginBottom: 15,
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: MythicTechColors.neonCyan,
    marginVertical: 10,
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  tagline: {
    fontSize: 14,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 16,
    color: MythicTechColors.neonCyan,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
  },
  loadingBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingBarBackground: {
    width: '80%',
    height: 4,
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue + '44',
  },
  loadingBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: MythicTechColors.neonBlue,
    borderRadius: 2,
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
  },
});