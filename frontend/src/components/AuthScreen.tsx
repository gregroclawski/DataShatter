import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MythicTechColors } from '../theme/MythicTechTheme';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 64) {
      newErrors.password = 'Password must not exceed 64 characters';
    }

    // Name validation for registration
    if (authMode === 'register') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 1) {
        newErrors.name = 'Name must not be empty';
      } else if (formData.name.length > 100) {
        newErrors.name = 'Name must not exceed 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    console.log('🔐 AUTH FORM SUBMIT - Starting authentication process...');
    console.log('  - Auth Mode:', authMode);
    console.log('  - Email:', formData.email);
    console.log('  - Password length:', formData.password.length);

    try {
      let result;
      if (authMode === 'login') {
        console.log('🔑 CALLING LOGIN FUNCTION...');
        result = await login(formData.email, formData.password);
      } else {
        console.log('📝 CALLING REGISTER FUNCTION...');
        result = await register(formData.email, formData.password, formData.name);
      }

      console.log('🔍 AUTH RESULT:', result);

      if (result.success) {
        console.log('✅ AUTHENTICATION SUCCESS - should navigate to game');
      } else {
        console.log('❌ AUTHENTICATION FAILED:', result.error);
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('🚨 AUTH ERROR CAUGHT:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (!result.success) {
      Alert.alert('Error', result.error || 'Google login failed');
    }
  };

  const switchMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setErrors({});
    if (authMode === 'login') {
      setFormData({ ...formData, name: '' });
    }
  };

  return (
    <LinearGradient
      colors={[MythicTechColors.darkSpace, MythicTechColors.deepVoid, MythicTechColors.shadowGrid]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoOrb}>
                <LinearGradient
                  colors={[MythicTechColors.neonBlue, MythicTechColors.neonPurple]}
                  style={styles.logoGradient}
                />
              </View>
            </View>
            
            <Text style={styles.title}>MYTHIC-TECH</Text>
            <Text style={styles.subtitle}>IDLE RPG</Text>
            
            <View style={styles.authToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.authToggleButton,
                  authMode === 'login' && styles.authToggleActive,
                ]}
                onPress={() => authMode !== 'login' && switchMode()}
              >
                <Text style={[
                  styles.authToggleText,
                  authMode === 'login' && styles.authToggleTextActive,
                ]}>
                  Login
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.authToggleButton,
                  authMode === 'register' && styles.authToggleActive,
                ]}
                onPress={() => authMode !== 'register' && switchMode()}
              >
                <Text style={[
                  styles.authToggleText,
                  authMode === 'register' && styles.authToggleTextActive,
                ]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {authMode === 'register' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>User Name</Text>
                <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color={MythicTechColors.neonCyan} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter your name"
                    placeholderTextColor={MythicTechColors.voidSilver + '88'}
                    autoCapitalize="words"
                    maxLength={100}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={MythicTechColors.neonCyan} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  placeholderTextColor={MythicTechColors.voidSilver + '88'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={MythicTechColors.neonCyan} />
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter your password"
                  placeholderTextColor={MythicTechColors.voidSilver + '88'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={64}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={MythicTechColors.neonCyan}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <Text style={styles.passwordHint}>8-64 characters required</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[MythicTechColors.neonBlue, MythicTechColors.neonPurple]}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>Processing...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {authMode === 'login' ? 'Login' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color={MythicTechColors.neonCyan} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: MythicTechColors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MythicTechColors.neonBlue,
    textShadowColor: MythicTechColors.neonBlue + '88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MythicTechColors.neonPurple,
    letterSpacing: 1,
    marginBottom: 30,
  },
  authToggleContainer: {
    flexDirection: 'row',
    backgroundColor: MythicTechColors.shadowGrid,
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue + '44',
  },
  authToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  authToggleActive: {
    backgroundColor: MythicTechColors.neonBlue,
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  authToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
  },
  authToggleTextActive: {
    color: MythicTechColors.darkSpace,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MythicTechColors.neonCyan,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MythicTechColors.shadowGrid + 'aa',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: MythicTechColors.neonBlue + '44',
  },
  inputError: {
    borderColor: MythicTechColors.error,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: MythicTechColors.neonCyan,
    marginLeft: 12,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: MythicTechColors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordHint: {
    fontSize: 11,
    color: MythicTechColors.voidSilver,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: MythicTechColors.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.darkSpace,
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: MythicTechColors.voidSilver + '44',
  },
  dividerText: {
    fontSize: 12,
    color: MythicTechColors.voidSilver,
    marginHorizontal: 16,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MythicTechColors.shadowGrid + 'aa',
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: MythicTechColors.neonCyan + '44',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: MythicTechColors.neonCyan,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 11,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
});