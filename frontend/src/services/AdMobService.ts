import { RewardedAd, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// AdMob Ad Unit IDs
const AD_UNIT_IDS = {
  rewarded: __DEV__ 
    ? TestIds.REWARDED 
    : 'ca-app-pub-9692390081647816/9535889564', // Production ad unit ID
};

export class AdMobService {
  private rewardedAd: RewardedAd | null = null;
  private isAdLoaded = false;
  private isLoading = false;
  private isInitialized = false;
  private onRewardEarnedCallback: ((ticketCount: number) => void) | null = null;

  constructor() {
    this.initializeRewardedAd();
  }

  private initializeRewardedAd() {
    try {
      if (!AD_UNIT_IDS.rewarded) {
        console.error('AdMob: No ad unit ID found for current platform');
        return;
      }

      console.log('🎯 AdMob: Initializing rewarded ad with ID:', AD_UNIT_IDS.rewarded);
      
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
        keywords: ['gaming', 'mobile', 'ninja', 'idle game'],
        requestNonPersonalizedAdsOnly: false,
      });

      this.setupEventListeners();
      this.loadAd();
      this.isInitialized = true;
    } catch (error) {
      console.error('🎯 AdMob: Failed to initialize - likely not in development build', error);
      this.isInitialized = false;
    }
  }

  private setupEventListeners() {
    if (!this.rewardedAd) return;

    // Ad loaded successfully
    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('🎯 AdMob: Rewarded ad loaded successfully');
      this.isAdLoaded = true;
      this.isLoading = false;
    });

    // Ad opened (displayed to user)
    this.rewardedAd.addAdEventListener(RewardedAdEventType.OPENED, () => {
      console.log('🎯 AdMob: Rewarded ad opened');
    });

    // User earned reward
    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('🎯 AdMob: User earned reward:', reward);
      
      // Award 10 revive tickets as specified
      const ticketCount = 10;
      console.log(`🎫 AdMob: Awarding ${ticketCount} revive tickets`);
      
      if (this.onRewardEarnedCallback) {
        this.onRewardEarnedCallback(ticketCount);
      }
    });

    // Ad closed
    this.rewardedAd.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      console.log('🎯 AdMob: Rewarded ad closed');
      this.isAdLoaded = false;
      
      // Pre-load next ad
      setTimeout(() => {
        this.loadAd();
      }, 1000);
    });

    // Ad failed to load - using correct event type for RewardedAd
    this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.error('🎯 AdMob: Rewarded ad error:', error);
      this.isAdLoaded = false;
      this.isLoading = false;
      
      // Retry loading after a delay
      setTimeout(() => {
        this.loadAd();
      }, 5000);
    });
  }

  public async loadAd(): Promise<void> {
    if (!this.rewardedAd || this.isLoading || this.isAdLoaded) {
      return;
    }

    try {
      this.isLoading = true;
      console.log('🎯 AdMob: Loading rewarded ad...');
      
      await this.rewardedAd.load();
    } catch (error) {
      console.error('🎯 AdMob: Failed to load rewarded ad:', error);
      this.isLoading = false;
      
      // Retry after delay
      setTimeout(() => {
        this.loadAd();
      }, 10000);
    }
  }

  public async showRewardedAd(onRewardEarned: (ticketCount: number) => void): Promise<boolean> {
    if (!this.isInitialized || !this.rewardedAd) {
      console.error('🎯 AdMob: Service not initialized - likely running in Expo Go');
      return false;
    }

    if (!this.isAdLoaded) {
      console.warn('🎯 AdMob: Rewarded ad not loaded yet');
      return false;
    }

    try {
      this.onRewardEarnedCallback = onRewardEarned;
      console.log('🎯 AdMob: Showing rewarded ad...');
      
      await this.rewardedAd.show();
      return true;
    } catch (error) {
      console.error('🎯 AdMob: Failed to show rewarded ad:', error);
      this.onRewardEarnedCallback = null;
      return false;
    }
  }

  public isServiceAvailable(): boolean {
    return this.isInitialized && this.rewardedAd !== null;
  }

  public isRewardedAdLoaded(): boolean {
    return this.isAdLoaded;
  }

  public isLoadingAd(): boolean {
    return this.isLoading;
  }

  // Force reload ad (useful for manual retry)
  public forceReload(): void {
    this.isAdLoaded = false;
    this.isLoading = false;
    this.loadAd();
  }
}

// Singleton instance
export const adMobService = new AdMobService();