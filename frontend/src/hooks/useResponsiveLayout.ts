import { useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveLayout {
  // Screen info
  screenWidth: number;
  screenHeight: number;
  isSmallScreen: boolean;
  isTablet: boolean;
  
  // Safe areas
  topInset: number;
  bottomInset: number;
  leftInset: number;
  rightInset: number;
  
  // Layout dimensions
  topBarHeight: number;
  bottomNavHeight: number;
  gameAreaHeight: number;
  
  // Element sizes
  ninjaSize: number;
  enemySize: number;
  iconSize: number;
  
  // Font sizes
  titleFontSize: number;
  bodyFontSize: number;
  smallFontSize: number;
  
  // Spacing
  paddingXS: number;
  paddingS: number;
  paddingM: number;
  paddingL: number;
  paddingXL: number;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  return useMemo(() => {
    // Screen classification
    const isSmallScreen = screenWidth < 375 || screenHeight < 667;
    const isTablet = screenWidth > 768 && screenHeight > 1024;
    
    // Base dimensions with scaling
    const scale = Math.min(screenWidth / 375, 1.2); // Base on iPhone 8 size, max 120% scaling
    
    // Safe area handling
    const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 0);
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
    const leftInset = insets.left;
    const rightInset = insets.right;
    
    // Dynamic layout dimensions
    const topBarHeight = Math.max(60, 50 + topInset * 0.5);
    const bottomNavHeight = Math.max(70, 60 + bottomInset * 0.3);
    const gameAreaHeight = screenHeight - topBarHeight - bottomNavHeight - topInset - bottomInset;
    
    // Responsive element sizes
    const ninjaSize = Math.max(30, 35 * scale);
    const enemySize = Math.max(25, 30 * scale);
    const iconSize = Math.max(18, 20 * scale);
    
    // Responsive font sizes
    const titleFontSize = Math.max(12, 14 * scale);
    const bodyFontSize = Math.max(10, 12 * scale);
    const smallFontSize = Math.max(9, 10 * scale);
    
    // Responsive spacing (8pt grid system)
    const baseSpacing = 8 * scale;
    const paddingXS = baseSpacing * 0.5; // 4px
    const paddingS = baseSpacing; // 8px
    const paddingM = baseSpacing * 1.5; // 12px
    const paddingL = baseSpacing * 2; // 16px
    const paddingXL = baseSpacing * 3; // 24px
    
    return {
      // Screen info
      screenWidth,
      screenHeight,
      isSmallScreen,
      isTablet,
      
      // Safe areas
      topInset,
      bottomInset,
      leftInset,
      rightInset,
      
      // Layout dimensions
      topBarHeight,
      bottomNavHeight,
      gameAreaHeight,
      
      // Element sizes
      ninjaSize,
      enemySize,
      iconSize,
      
      // Font sizes
      titleFontSize,
      bodyFontSize,
      smallFontSize,
      
      // Spacing
      paddingXS,
      paddingS,
      paddingM,
      paddingL,
      paddingXL,
    };
  }, [screenWidth, screenHeight, insets.top, insets.bottom, insets.left, insets.right]);

  return layout;
};