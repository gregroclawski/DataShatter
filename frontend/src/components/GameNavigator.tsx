import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import NinjaStatsScreen from '../screens/NinjaStatsScreen';
import ShurikenScreen from '../screens/ShurikenScreen';
import PetScreen from '../screens/PetScreen';
import TrainingScreen from '../screens/TrainingScreen';
import RaidScreen from '../screens/RaidScreen';
import AdventureScreen from '../screens/AdventureScreen';

const Tab = createBottomTabNavigator();

const GameNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Stats') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Shurikens') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Pets') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Training') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Raids') {
            iconName = focused ? 'sword' : 'sword-outline';
          } else if (route.name === 'Adventure') {
            iconName = focused ? 'map' : 'map-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopWidth: 1,
          borderTopColor: '#374151',
          paddingBottom: 5,
          paddingTop: 5,
          height: 65,
        },
        headerStyle: {
          backgroundColor: '#1e293b',
          borderBottomWidth: 1,
          borderBottomColor: '#374151',
        },
        headerTintColor: '#f8fafc',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Stats" component={NinjaStatsScreen} />
      <Tab.Screen name="Shurikens" component={ShurikenScreen} />
      <Tab.Screen name="Pets" component={PetScreen} />
      <Tab.Screen name="Training" component={TrainingScreen} />
      <Tab.Screen name="Raids" component={RaidScreen} />
      <Tab.Screen name="Adventure" component={AdventureScreen} />
    </Tab.Navigator>
  );
};

export default GameNavigator;