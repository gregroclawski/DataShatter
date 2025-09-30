// Mock Ad Service for Development - No AdMob dependencies
export class MockAdService {
  private isInitialized = true;

  public async showRewardedAd(onRewardEarned: (ticketCount: number) => void): Promise<boolean> {
    try {
      console.log('🎯 Mock Ad: Showing mock rewarded ad...');
      
      // Simulate ad loading and completion
      setTimeout(() => {
        console.log('🎯 Mock Ad: Completed, awarding 10 tickets');
        onRewardEarned(10);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('🎯 Mock Ad: Failed to show ad:', error);
      return false;
    }
  }

  public isRewardedAdLoaded(): boolean {
    return true;
  }

  public isServiceAvailable(): boolean {
    return this.isInitialized;
  }

  public forceReload(): void {
    console.log('🎯 Mock Ad: Force reload (no-op)');
  }
}

// Export singleton instance
export const mockAdService = new MockAdService();