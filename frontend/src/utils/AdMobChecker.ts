import { Platform } from 'react-native';

export const checkAdMobEnvironment = () => {
  console.log('🔍 AdMob Environment Check:');
  console.log('  Platform:', Platform.OS);
  console.log('  Development Mode:', __DEV__);
  
  try {
    // Try to import AdMob modules
    const { TestIds, RewardedAd } = require('react-native-google-mobile-ads');
    console.log('  ✅ AdMob modules available');
    console.log('  Test IDs available:', !!TestIds);
    console.log('  RewardedAd available:', !!RewardedAd);
    
    // Check if we can create a test ad
    const testAdUnit = __DEV__ ? TestIds.REWARDED : 'test';
    console.log('  Test Ad Unit:', testAdUnit);
    
    return {
      available: true,
      testIds: TestIds,
      rewardedAd: RewardedAd
    };
  } catch (error) {
    console.log('  ❌ AdMob modules not available:', error.message);
    return {
      available: false,
      error: error.message
    };
  }
};

export const createMockAdService = () => {
  console.log('🎯 Creating Mock AdMob Service for testing...');
  
  return {
    showRewardedAd: async (onRewardEarned: (ticketCount: number) => void): Promise<boolean> => {
      console.log('🎯 MOCK: Showing mock rewarded ad...');
      
      // Simulate ad loading and completion
      setTimeout(() => {
        console.log('🎯 MOCK: Ad completed, awarding 10 tickets');
        onRewardEarned(10);
      }, 2000);
      
      return true;
    },
    isRewardedAdLoaded: () => true,
    isServiceAvailable: () => true
  };
};