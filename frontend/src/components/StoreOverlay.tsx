import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

interface GemPackage {
  id: string;
  name: string;
  gems: number;
  price: string;
  originalPrice?: string;
  discount?: number;
  bonus?: number;
  featured?: boolean;
  bestValue?: boolean;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  duration: string;
  subscriptionType: 'xp_drop_boost' | 'zone_progression_boost';
  popular?: boolean;
}

type TabType = 'items' | 'subscriptions' | 'gems';

const StoreOverlay = ({ onClose }: Props) => {
  const { gameState, updateNinja, saveOnEvent } = useGame();
  const { user } = useAuth();
  const { ninja } = gameState;
  
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Use same API base URL configuration as other components
  const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const subscriptionPackages: SubscriptionPackage[] = [
    {
      id: 'xp_drop_boost',
      name: 'XP & Drop Booster',
      description: 'Double your progression speed',
      features: [
        '2x Experience Points',
        '2x Drop Rate',
        'Stack with other bonuses',
        'Server-side tracking'
      ],
      price: '$40.00',
      duration: '30 Days',
      subscriptionType: 'xp_drop_boost',
      popular: true
    },
    {
      id: 'zone_progression_boost',
      name: 'Zone Rush Boost',
      description: 'Accelerate zone progression',
      features: [
        '2x Zone Kill Progress',
        'Unlock zones faster',
        'Perfect for advancement',
        'Server-side tracking'
      ],
      price: '$40.00',
      duration: '30 Days',
      subscriptionType: 'zone_progression_boost'
    }
  ];

  const gemPackages: GemPackage[] = [
    {
      id: 'com.ninjaidle.gems_starter',
      name: 'Starter Pack',
      gems: 100,
      price: '$0.99',
      bonus: 10,
    },
    {
      id: 'com.ninjaidle.gems_small',
      name: 'Small Gem Bag',
      gems: 250,
      price: '$1.99',
      bonus: 25,
    },
    {
      id: 'com.ninjaidle.gems_medium',
      name: 'Medium Gem Bag',
      gems: 500,
      price: '$4.99',
      bonus: 75,
      featured: true,
    },
    {
      id: 'com.ninjaidle.gems_large',
      name: 'Large Gem Bag',
      gems: 1000,
      price: '$9.99',
      bonus: 200,
      bestValue: true,
    },
    {
      id: 'com.ninjaidle.gems_mega',
      name: 'Mega Gem Bag',
      gems: 2500,
      price: '$19.99',
      bonus: 750,
      originalPrice: '$24.99',
      discount: 20,
    },
    {
      id: 'com.ninjaidle.gems_ultimate',
      name: 'Ultimate Gem Vault',
      gems: 5000,
      price: '$39.99',
      bonus: 2000,
      originalPrice: '$49.99',
      discount: 20,
      featured: true,
    },
  ];

  useEffect(() => {
    loadActiveSubscriptions();
  }, []);

  const loadActiveSubscriptions = async () => {
    try {
      console.log('🏪 LOADING SUBSCRIPTIONS - API_BASE_URL:', API_BASE_URL);
      console.log('🔐 Using access token:', user?.access_token?.substring(0, 10) + '...');
      
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/active`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const purchaseSubscription = async (subscriptionPackage: SubscriptionPackage) => {
    try {
      setPurchasing(subscriptionPackage.id);

      // Check if user already has this subscription type
      const hasActiveSubscription = subscriptions.some(
        sub => sub.subscription_type === subscriptionPackage.subscriptionType
      );

      if (hasActiveSubscription) {
        Alert.alert(
          'Already Subscribed',
          'You already have an active subscription of this type. Wait for it to expire before purchasing again.'
        );
        return;
      }

      const response = await fetch(`${process.env.EXPO_BACKEND_URL}/api/subscriptions/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_type: subscriptionPackage.subscriptionType,
          payment_method: 'demo'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        Alert.alert(
          '🎉 Subscription Activated!',
          `${subscriptionPackage.name} is now active for 30 days!\n\nEnjoy your enhanced progression!`,
          [{ text: 'Awesome!' }]
        );

        // Reload subscriptions
        await loadActiveSubscriptions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Purchase failed');
      }
    } catch (error) {
      console.error('Subscription purchase error:', error);
      Alert.alert('Purchase Failed', 'Unable to complete subscription purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const purchaseGems = async (gemPackage: GemPackage) => {
    try {
      setPurchasing(gemPackage.id);

      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Calculate total gems (base + bonus)
      const totalGems = gemPackage.gems + (gemPackage.bonus || 0);

      // Update ninja gems
      updateNinja(prev => ({
        ...prev,
        gems: prev.gems + totalGems
      }));

      // Trigger save
      setTimeout(() => {
        saveOnEvent('gem_purchase');
      }, 100);

      Alert.alert(
        '🎉 Purchase Successful!',
        `${gemPackage.name} purchased!\n\nGems Added: +${totalGems.toLocaleString()}\nNew Balance: ${(ninja.gems + totalGems).toLocaleString()} gems`,
        [{ text: 'Awesome!' }]
      );

    } catch (error) {
      console.error('Gem purchase error:', error);
      Alert.alert('Purchase Failed', 'Unable to complete gem purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const renderTabButton = (tab: TabType, icon: string, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
      >
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={isActive ? '#ffffff' : '#94a3b8'} 
        />
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItemsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.emptyStateTitle}>Items Coming Soon</Text>
      <Text style={styles.emptyStateDescription}>
        Premium items and upgrades will be available here soon!
      </Text>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="construct" size={64} color="#64748b" />
      </View>
    </View>
  );

  const renderSubscriptionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Active Subscriptions */}
      {!loadingSubscriptions && subscriptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          {subscriptions.map((sub, index) => (
            <View key={index} style={styles.activeSubscriptionCard}>
              <View style={styles.activeSubscriptionHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <View style={styles.activeSubscriptionInfo}>
                  <Text style={styles.activeSubscriptionName}>
                    {sub.subscription_type === 'xp_drop_boost' ? 'XP & Drop Booster' : 'Zone Rush Boost'}
                  </Text>
                  <Text style={styles.activeSubscriptionExpiry}>
                    Expires: {new Date(sub.end_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Available Subscriptions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Subscriptions</Text>
        <Text style={styles.sectionSubtitle}>Boost your ninja's potential</Text>
        
        {subscriptionPackages.map((subscriptionPackage) => {
          const hasActiveSubscription = subscriptions.some(
            sub => sub.subscription_type === subscriptionPackage.subscriptionType
          );

          return (
            <View 
              key={subscriptionPackage.id} 
              style={[
                styles.subscriptionCard,
                hasActiveSubscription && styles.subscriptionCardDisabled
              ]}
            >
              {/* Popular Badge */}
              {subscriptionPackage.popular && !hasActiveSubscription && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>POPULAR</Text>
                </View>
              )}

              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionName}>{subscriptionPackage.name}</Text>
                <Text style={styles.subscriptionDescription}>{subscriptionPackage.description}</Text>
              </View>

              <View style={styles.subscriptionFeatures}>
                {subscriptionPackage.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.subscriptionFooter}>
                <View style={styles.subscriptionPricing}>
                  <Text style={styles.subscriptionPrice}>{subscriptionPackage.price}</Text>
                  <Text style={styles.subscriptionDuration}>for {subscriptionPackage.duration}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscriptionButton,
                    hasActiveSubscription && styles.subscriptionButtonDisabled
                  ]}
                  onPress={() => purchaseSubscription(subscriptionPackage)}
                  disabled={purchasing === subscriptionPackage.id || hasActiveSubscription}
                >
                  {purchasing === subscriptionPackage.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.subscriptionButtonText,
                      hasActiveSubscription && styles.subscriptionButtonTextDisabled
                    ]}>
                      {hasActiveSubscription ? 'ACTIVE' : 'SUBSCRIBE'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Demo Notice */}
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={20} color="#8b5cf6" />
        <Text style={styles.noticeText}>
          **DEMO MODE**: Subscriptions are simulated for testing. No real money will be charged.
        </Text>
      </View>
    </ScrollView>
  );

  const renderGemsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Balance */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="diamond" size={32} color="#3b82f6" />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{ninja.gems.toLocaleString()} Gems</Text>
          </View>
        </View>
      </View>

      {/* Gem Packages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gem Packages</Text>
        <Text style={styles.sectionSubtitle}>Power up your ninja with premium gems</Text>
        
        {gemPackages.map((gemPackage) => (
          <View 
            key={gemPackage.id} 
            style={[
              styles.gemPackageCard,
              gemPackage.bestValue && styles.bestValueCard,
              gemPackage.featured && !gemPackage.bestValue && styles.featuredCard
            ]}
          >
            {/* Package badges */}
            <View style={styles.badgeContainer}>
              {gemPackage.bestValue && (
                <View style={[styles.badge, styles.bestValueBadge]}>
                  <Ionicons name="trophy" size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>BEST VALUE</Text>
                </View>
              )}
              {gemPackage.featured && !gemPackage.bestValue && (
                <View style={[styles.badge, styles.featuredBadge]}>
                  <Ionicons name="star" size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>POPULAR</Text>
                </View>
              )}
              {gemPackage.discount && (
                <View style={[styles.badge, styles.discountBadge]}>
                  <Text style={styles.badgeText}>-{gemPackage.discount}%</Text>
                </View>
              )}
            </View>

            <View style={styles.gemPackageContent}>
              {/* Gem Icon */}
              <View style={styles.gemIcon}>
                <Ionicons name="diamond" size={32} color="#3b82f6" />
              </View>

              {/* Package Info */}
              <View style={styles.gemPackageInfo}>
                <Text style={styles.gemPackageName}>{gemPackage.name}</Text>
                <View style={styles.gemPackageDetails}>
                  <Text style={styles.gemCount}>
                    {(gemPackage.gems + (gemPackage.bonus || 0)).toLocaleString()} Gems
                  </Text>
                  {gemPackage.bonus && (
                    <Text style={styles.bonusText}>
                      +{gemPackage.bonus} Bonus!
                    </Text>
                  )}
                </View>
              </View>

              {/* Pricing */}
              <View style={styles.gemPricing}>
                {gemPackage.originalPrice && (
                  <Text style={styles.originalPrice}>{gemPackage.originalPrice}</Text>
                )}
                <Text style={styles.gemPrice}>{gemPackage.price}</Text>
              </View>

              {/* Purchase Button */}
              <TouchableOpacity
                style={styles.gemPurchaseButton}
                onPress={() => purchaseGems(gemPackage)}
                disabled={purchasing === gemPackage.id}
              >
                {purchasing === gemPackage.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.gemPurchaseButtonText}>BUY</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Demo Notice */}
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={20} color="#8b5cf6" />
        <Text style={styles.noticeText}>
          **DEMO MODE**: Purchases are simulated for testing. No real money will be charged.
        </Text>
      </View>

      {/* Gem Benefits */}
      <View style={styles.noticeCard}>
        <Ionicons name="diamond" size={20} color="#10b981" />
        <Text style={styles.noticeText}>
          Gems are used to purchase upgrades, boost your progress, and unlock special features!
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('items', 'bag', 'Items')}
        {renderTabButton('subscriptions', 'star', 'Subscriptions')}
        {renderTabButton('gems', 'diamond', 'Gems')}
      </View>

      {/* Tab Content */}
      {activeTab === 'items' && renderItemsTab()}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'gems' && renderGemsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  activeTabButton: {
    backgroundColor: '#8b5cf6',
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabLabel: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  emptyStateIcon: {
    alignItems: 'center',
    marginBottom: 40,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceInfo: {
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  subscriptionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  subscriptionCardDisabled: {
    opacity: 0.6,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  subscriptionFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#e2e8f0',
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPricing: {
    flex: 1,
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subscriptionDuration: {
    fontSize: 14,
    color: '#94a3b8',
  },
  subscriptionButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  subscriptionButtonDisabled: {
    backgroundColor: '#64748b',
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  subscriptionButtonTextDisabled: {
    color: '#cbd5e1',
  },
  activeSubscriptionCard: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  activeSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeSubscriptionInfo: {
    marginLeft: 12,
  },
  activeSubscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  activeSubscriptionExpiry: {
    fontSize: 14,
    color: '#6ee7b7',
  },
  gemPackageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  bestValueCard: {
    borderColor: '#f59e0b',
    backgroundColor: '#451a03',
  },
  featuredCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#3c1361',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: 16,
    flexDirection: 'row',
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  bestValueBadge: {
    backgroundColor: '#f59e0b',
  },
  featuredBadge: {
    backgroundColor: '#8b5cf6',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  gemPackageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gemIcon: {
    marginRight: 16,
  },
  gemPackageInfo: {
    flex: 1,
  },
  gemPackageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  gemPackageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gemCount: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  bonusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 8,
  },
  gemPricing: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  originalPrice: {
    fontSize: 12,
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  gemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  gemPurchaseButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  gemPurchaseButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noticeText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 20,
  },
});

export default StoreOverlay;