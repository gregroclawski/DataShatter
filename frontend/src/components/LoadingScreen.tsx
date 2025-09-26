import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MythicTechColors } from '../theme/MythicTechTheme';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Initializing authentication..." }) => {
  // Use dynamic dimensions for mobile responsiveness 
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  
  // ALL animation refs must be at top level - no hooks inside other hooks!
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glitchTranslate = useRef(new Animated.Value(0)).current;
  const gridPulse = useRef(new Animated.Value(0.3)).current;
  const orbGlow = useRef(new Animated.Value(0.5)).current;
  
  // Create particle animation refs at top level (FIXED - no useRef inside useMemo!)
  const particle0 = useRef(new Animated.Value(0)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;
  
  // Memoize particle refs array to prevent recreation (FIXED - breaks infinite dependency loop!)
  const particleRefs = useMemo(() => [
    particle0, particle1, particle2, particle3, particle4, particle5
  ], []); // Empty dependency - create once and never change
  
  // Memoize all dynamic styles to prevent inline object recreation
  const contentStyle = useMemo(() => ([
    styles.content,
    {
      opacity: fadeAnim,
      transform: [{ translateX: glitchTranslate }],
    },
  ]), [fadeAnim, glitchTranslate]);
  
  const orbStyle = useMemo(() => ([
    styles.orb,
    {
      transform: [{ rotate: rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }) }],
      opacity: orbGlow,
    },
  ]), [rotateAnim, orbGlow]);
  
  const orbGlowStyle = useMemo(() => ([
    styles.orbGlow,
    {
      transform: [{ scale: pulseAnim }],
      opacity: orbGlow.interpolate({
        inputRange: [0.3, 1],
        outputRange: [0.1, 0.3],
      }),
    },
  ]), [pulseAnim, orbGlow]);
  
  const gridOverlayStyle = useMemo(() => ([
    styles.gridOverlay,
    {
      opacity: gridPulse,
    },
  ]), [gridPulse]);
  
  // Memoize particle styles (FIXED - no useRef calls inside!)
  const particleStyles = useMemo(() => {
    return particleRefs.map((animValue, i) => ([
      styles.particle,
      {
        left: (i * SCREEN_WIDTH / 6) + (SCREEN_WIDTH / 12),
        transform: [{
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [SCREEN_HEIGHT, -100],
          }),
        }],
        opacity: animValue.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        }),
      },
    ]));
  }, [particleRefs]);
  
  // Start animations in useEffect (FIXED - no useCallback dependency chain)
  useEffect(() => {
    // Main fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Continuous orb rotation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    
    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Glitch effect
    const glitchLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitchTranslate, {
          toValue: 2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchTranslate, {
          toValue: -2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchTranslate, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    );
    
    // Grid pulse
    const gridLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gridPulse, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(gridPulse, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Orb glow
    const orbGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlow, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(orbGlow, {
          toValue: 0.5,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Particle animations
    const particleAnimations = particleRefs.map((animValue, i) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000 + (i * 500),
          useNativeDriver: true,
        })
      );
    });
    
    // Start all animations
    rotateLoop.start();
    pulseLoop.start();
    glitchLoop.start();
    gridLoop.start();
    orbGlowLoop.start();
    particleAnimations.forEach(anim => anim.start());
    
    // Cleanup function
    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      glitchLoop.stop();
      gridLoop.stop();
      orbGlowLoop.stop();
      particleAnimations.forEach(anim => anim.stop());
    };
  }, []); // Empty dependency array - run once on mount
  
  return (
    <LinearGradient
      colors={[MythicTechColors.darkSpace, MythicTechColors.deepVoid, MythicTechColors.shadowGrid]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <Animated.View style={contentStyle}>
        {/* Central Energy Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={orbGlowStyle} />
          <Animated.View style={orbStyle}>
            <View style={styles.orbCore} />
            <View style={styles.orbRing} />
          </Animated.View>
        </View>
        
        {/* Grid Overlay */}
        <Animated.View style={gridOverlayStyle}>
          <View style={styles.gridLines} />
        </Animated.View>
        
        {/* Floating Particles */}
        {particleStyles.map((particle, i) => (
          <Animated.View key={i} style={particle} />
        ))}
        
        {/* Loading Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>MYTHIC-TECH</Text>
          <Text style={styles.subtitle}>NINJA SYSTEMS</Text>
          <View style={styles.loadingBar}>
            <Animated.View style={[styles.loadingProgress, { width: '100%' }]} />
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MythicTechColors.darkSpace,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  orbContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MythicTechColors.neonCyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  orbCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MythicTechColors.electricBlue,
    shadowColor: MythicTechColors.electricBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  orbRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: MythicTechColors.neonCyan,
    opacity: 0.6,
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: MythicTechColors.neonCyan,
    opacity: 0.2,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  gridLines: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MythicTechColors.matrixGreen,
    opacity: 0.2,
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
    shadowRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MythicTechColors.neonCyan,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: MythicTechColors.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: MythicTechColors.electricBlue,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
    opacity: 0.8,
  },
  loadingBar: {
    width: 200,
    height: 3,
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: MythicTechColors.neonCyan,
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  message: {
    fontSize: 16,
    color: MythicTechColors.holographicBlue,
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 1,
  },
});

export default LoadingScreen;