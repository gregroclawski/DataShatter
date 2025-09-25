import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../contexts/GameContext';

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

const StoreOverlay = ({ onClose }: Props) => {
  const { gameState, updateNinja } = useGame();
  const { ninja } = gameState;
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [storeAvailable, setStoreAvailable] = useState(true);

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
      name: 'Medium Gem Chest',
      gems: 600,
      price: '$4.99',
      bonus: 100,
      featured: true,
    },
    {
      id: 'com.ninjaidle.gems_large',
      name: 'Large Gem Vault',
      gems: 1300,
      price: '$9.99',
      originalPrice: '$12.99',
      discount: 23,
      bonus: 300,
      bestValue: true,
    },
    {
      id: 'com.ninjaidle.gems_mega',
      name: 'Mega Gem Treasure',
      gems: 2800,
      price: '$19.99',
      bonus: 700,
    },
    {
      id: 'com.ninjaidle.gems_ultimate',
      name: 'Ultimate Collection',
      gems: 6500,
      price: '$49.99',
      bonus: 1500,
      featured: true,
    },
  ];

  useEffect(() => {
    // Initialize in-app purchase system
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // This would integrate with react-native-purchases or react-native-iap
      // For demonstration, we'll simulate the initialization
      console.log('Initializing in-app purchase system...');
      setStoreAvailable(true);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
      setStoreAvailable(false);
      Alert.alert(
        'Store Unavailable',
        'The app store is currently unavailable. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePurchase = async (gemPackage: GemPackage) => {
    if (!storeAvailable) {
      Alert.alert('Store Unavailable', 'Please try again later.');
      return;
    }

    // Fake authentication step for realistic feel
    Alert.alert(
      'Store Authentication',
      'Please authenticate your purchase',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Face ID',
          onPress: () => authenticateAndPurchase(gemPackage, 'face_id'),
        },
        {
          text: 'Passcode',
          onPress: () => authenticateAndPurchase(gemPackage, 'passcode'),
        },
      ]
    );
  };

  const authenticateAndPurchase = async (gemPackage: GemPackage, authMethod: string) => {
    setPurchasing(gemPackage.id);

    try {
      // Simulate authentication process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show purchase confirmation after "authentication"
      Alert.alert(
        'Confirm Purchase',
        `Purchase ${gemPackage.name} for ${gemPackage.price}?\n\n` +
        `You will receive ${gemPackage.gems + (gemPackage.bonus || 0)} gems.\n\n` +
        `✅ Authenticated via ${authMethod === 'face_id' ? 'Face ID' : 'Passcode'}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setPurchasing(null),
          },
          {
            text: 'Confirm Purchase',
            style: 'default',
            onPress: () => processPurchase(gemPackage, authMethod),
          },
        ]
      );
    } catch (error) {
      setPurchasing(null);
      Alert.alert('Authentication Failed', 'Please try again.');
    }
  };

  const processPurchase = async (gemPackage: GemPackage, authMethod: string) => {
    try {
      // Simulate realistic purchase processing with multiple steps
      console.log('💳 Processing purchase with', authMethod, 'authentication');
      
      // Step 1: Validate authentication (simulated)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Process payment (simulated)
      console.log('💳 Contacting payment processor...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Step 3: Validate receipt (simulated)
      console.log('🧾 Validating purchase receipt...');
      await new Promise(resolve => setTimeout(resolve, 600));

      // Calculate total gems with bonus
      const totalGems = gemPackage.gems + (gemPackage.bonus || 0);
      
      // Update gems and trigger event-driven save
      updateNinja({
        gems: ninja.gems + totalGems,
      });

      setPurchasing(null);

      // Show detailed success message
      Alert.alert(
        '🎉 Purchase Successful!',
        `Transaction completed via ${authMethod === 'face_id' ? 'Face ID' : 'Passcode'}\n\n` +
        `${gemPackage.name} purchased for ${gemPackage.price}\n` +
        `• Base Gems: ${gemPackage.gems.toLocaleString()}\n` +
        `• Bonus Gems: ${(gemPackage.bonus || 0).toLocaleString()}\n` +
        `• Total Added: ${totalGems.toLocaleString()} gems\n\n` +
        `New Balance: ${(ninja.gems + totalGems).toLocaleString()} gems`,
        [{ text: 'Awesome!', style: 'default' }]
      );

      // Log purchase for analytics/debugging
      console.log(`🛒 Purchase completed: ${gemPackage.name} (+${totalGems} gems)`);

    } catch (error) {
      setPurchasing(null);
      console.error('Purchase processing error:', error);
      Alert.alert(
        'Purchase Failed',
        `Authentication failed or payment could not be processed.\n\n` +
        `You have not been charged.\n\n` +
        `Please check your ${authMethod === 'face_id' ? 'Face ID settings' : 'passcode'} and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getPackageColor = (gemPackage: GemPackage) => {
    if (gemPackage.bestValue) return '#f59e0b';
    if (gemPackage.featured) return '#8b5cf6';
    return '#374151';
  };

  const getPackageBorderColor = (gemPackage: GemPackage) => {
    if (gemPackage.bestValue) return '#f59e0b';
    if (gemPackage.featured) return '#8b5cf6';
    return '#4b5563';
  };

  const formatGemCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gem Store</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Store Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color="#8b5cf6" />
          <Text style={styles.noticeText}>
            Gems are used to purchase upgrades, boost your progress, and unlock special features!
          </Text>
        </View>

        {/* Gem Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gem Packages</Text>
          <Text style={styles.sectionSubtitle}>Power up your ninja with premium gems</Text>
          
          {gemPackages.map((gemPackage) => (
            <View 
              key={gemPackage.id} 
              style={[
                styles.packageCard,
                { 
                  backgroundColor: getPackageColor(gemPackage),
                  borderColor: getPackageBorderColor(gemPackage),
                }
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
                    <Text style={styles.badgeText}>{gemPackage.discount}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.packageContent}>
                {/* Package info */}
                <View style={styles.packageInfo}>
                  <Text style={styles.packageName}>{gemPackage.name}</Text>
                  
                  <View style={styles.gemInfo}>
                    <Ionicons name="diamond" size={20} color="#3b82f6" />
                    <Text style={styles.gemCount}>
                      {formatGemCount(gemPackage.gems)}
                    </Text>
                    {gemPackage.bonus && (
                      <>
                        <Text style={styles.plusText}>+</Text>
                        <Text style={styles.bonusCount}>{formatGemCount(gemPackage.bonus)}</Text>
                        <Text style={styles.bonusLabel}>bonus</Text>
                      </>
                    )}
                  </View>
                  
                  <View style={styles.totalGems}>
                    <Text style={styles.totalLabel}>Total: </Text>
                    <Text style={styles.totalValue}>
                      {formatGemCount(gemPackage.gems + (gemPackage.bonus || 0))} gems
                    </Text>
                  </View>
                </View>

                {/* Price and button */}
                <View style={styles.priceSection}>
                  {gemPackage.originalPrice && (
                    <Text style={styles.originalPrice}>{gemPackage.originalPrice}</Text>
                  )}
                  <Text style={styles.price}>{gemPackage.price}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      purchasing === gemPackage.id && styles.purchasingButton,
                      !storeAvailable && styles.disabledButton,
                    ]}
                    onPress={() => handlePurchase(gemPackage)}
                    disabled={purchasing !== null || !storeAvailable}
                  >
                    {purchasing === gemPackage.id ? (
                      <View style={styles.purchaseButtonContent}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.purchaseButtonText}>Processing...</Text>
                      </View>
                    ) : (
                      <View style={styles.purchaseButtonContent}>
                        <Ionicons name="card" size={16} color="#ffffff" />
                        <Text style={styles.purchaseButtonText}>Purchase</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Store features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Purchase Gems?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={20} color="#f59e0b" />
              <Text style={styles.featureText}>Skip waiting times and progress faster</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="star" size={20} color="#8b5cf6" />
              <Text style={styles.featureText}>Unlock exclusive upgrades and abilities</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="trophy" size={20} color="#10b981" />
              <Text style={styles.featureText}>Dominate leaderboards with premium gear</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="shield" size={20} color="#3b82f6" />
              <Text style={styles.featureText}>Secure transactions protected by app stores</Text>
            </View>
          </View>
        </View>

        {!storeAvailable && (
          <View style={styles.unavailableSection}>
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
            <Text style={styles.unavailableTitle}>Store Temporarily Unavailable</Text>
            <Text style={styles.unavailableText}>
              We're experiencing technical difficulties. Please try again later.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#374151',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
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
    color: '#9ca3af',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 12,
    lineHeight: 18,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
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
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  packageContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  gemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gemCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginLeft: 6,
  },
  plusText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 6,
  },
  bonusCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  bonusLabel: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  totalGems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  purchaseButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  purchasingButton: {
    backgroundColor: '#6b46c1',
  },
  disabledButton: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
  purchaseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  featuresSection: {
    padding: 20,
    paddingTop: 0,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
    flex: 1,
  },
  unavailableSection: {
    alignItems: 'center',
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 8,
  },
  unavailableText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default StoreOverlay;