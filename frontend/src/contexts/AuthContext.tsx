import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_active: boolean;
  provider: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Check existing session on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setIsLoading(true);
      const startTime = Date.now(); // Track loading start time
      
      // Check stored token first
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      console.log('🔍 Session check - Token exists:', !!storedToken, 'User exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 Restoring user session:', userData.email, 'ID:', userData.id);
          
          setToken(storedToken);
          setUser(userData);
          
          // Simple session validation
          try {
            const isValid = await checkSession();
            if (isValid) {
              console.log('✅ Session validation successful - user auto-logged in');
            } else {
              console.log('❌ Session validation failed - clearing stored session');
              await logout();
            }
          } catch (error) {
            console.log('⚠️ Session validation error - keeping session:', error);
            // Keep session on network errors
          }
          
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // Clear invalid stored data
          await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('🔍 No stored session found - showing auth screen');
      }

      // Reduce loading time to prevent stuck loading
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 2000; // Reduced to 2 seconds
      if (elapsedTime < minLoadingTime) {
        const remainingTime = minLoadingTime - elapsedTime;
        console.log(`⏱️ Extending loading screen for ${remainingTime}ms`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      console.log('🏁 Auth loading completed, setting isLoading to false');
    } catch (error) {
      console.error('Error checking existing session:', error);
      // Don't logout on errors, just continue
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      // Always return true if we have both token and user to avoid unnecessary logouts
      if (!token || !user) {
        console.log('No token or user found - session invalid');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/session/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('Session check failed:', response.status);
        return false;
      }

      const data = await response.json();
      const isValid = data.authenticated === true;
      
      if (isValid && data.user) {
        // Update user data if it changed
        setUser(data.user);
        console.log('✅ Session validated successfully for user:', data.user.email);
      } else {
        console.log('❌ Session check returned invalid:', data);
      }
      
      return isValid;
    } catch (error) {
      console.error('Session check network error - keeping current session:', error);
      // CRITICAL: Don't log out on network errors - keep current session
      // This prevents users from losing progress due to temporary network issues
      return true; // Keep user logged in on network errors
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2PasswordRequestForm uses 'username'
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Login failed' };
      }

      // Store auth data
      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);

      console.log('✅ Login successful - User ID:', data.user.id, 'Token stored');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Registration failed' };
      }

      // Store auth data
      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);

      console.log('✅ Registration successful - User ID:', data.user.id, 'Token stored');

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // For now, redirect to Google OAuth URL
      // In a real implementation, you'd use WebBrowser.openAuthSessionAsync
      const redirectUrl = encodeURIComponent(window.location.href);
      const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
      
      // Open Google auth in new window/tab
      window.open(googleAuthUrl, '_self');
      
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Google login failed' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout if we have a token
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth data
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        loginWithGoogle,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};