import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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

const getBackendUrl = (): string => {
  // SIMPLIFIED: Always use environment variable first, then fallback to localhost
  const envBackendUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
  
  console.log('🔧 BACKEND URL DETECTION (SIMPLIFIED):');
  console.log('  - ENV EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
  console.log('  - expoConfig.extra.backendUrl:', Constants.expoConfig?.extra?.backendUrl);
  
  // Use environment variable if set, otherwise fallback to localhost
  const backendUrl = envBackendUrl || 'http://localhost:8001';
  console.log('  - Selected backend URL:', backendUrl);
  
  return backendUrl;
};

const API_BASE_URL = getBackendUrl();

console.log('🔧 AuthContext - Backend URL Configuration:');
console.log('  - Detected API_BASE_URL:', API_BASE_URL);
if (typeof window !== 'undefined') {
  console.log('  - Current hostname:', window.location.hostname);
  console.log('  - Current protocol:', window.location.protocol);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  const isAuthenticated = !!user && !!token;

  // Debug authentication state changes
  useEffect(() => {
    console.log('🔍 AUTH STATE CHANGE:');
    console.log('  - user exists:', !!user);
    console.log('  - token exists:', !!token);
    console.log('  - isAuthenticated:', isAuthenticated);
    if (user) console.log('  - user email:', user.email);
    if (token) console.log('  - token preview:', token.substring(0, 15) + '...');
  }, [user, token, isAuthenticated]);

  // Memoize the combined loading state to prevent infinite re-renders
  const actualIsLoading = React.useMemo(() => {
    return isLoading || !minLoadingComplete;
  }, [isLoading, minLoadingComplete]);

  // Set up minimum loading timer on app start
  useEffect(() => {
    console.log('🕐 Starting 2-second loading timer...');
    const minLoadingTimer = setTimeout(() => {
      console.log('⏰ 2-second loading timer complete');
      setMinLoadingComplete(true);
    }, 2000);

    return () => clearTimeout(minLoadingTimer);
  }, []);

  // Start authentication check on app start  
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = React.useCallback(async () => {
    try {
      console.log('🔍 Checking for stored login credentials...');
      
      // Check for stored login credentials with web fallback
      let storedEmail = null;
      let storedPassword = null;
      
      try {
        // Try AsyncStorage first (mobile)
        storedEmail = await AsyncStorage.getItem('login_email');
        storedPassword = await AsyncStorage.getItem('login_password');
        console.log('✅ Using AsyncStorage for mobile');
      } catch (asyncError) {
        console.log('AsyncStorage failed:', asyncError);
        // Only use localStorage if in web environment
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            storedEmail = window.localStorage.getItem('login_email');
            storedPassword = window.localStorage.getItem('login_password');
            console.log('✅ Using localStorage fallback for web');
          } catch (localError) {
            console.error('localStorage also failed:', localError);
          }
        } else {
          console.log('📱 Mobile environment - no localStorage available');
        }
      }
      
      console.log('🔍 Stored credentials check:');
      console.log('  - Email exists:', !!storedEmail);
      console.log('  - Password exists:', !!storedPassword);
      if (storedEmail) console.log('  - Email:', storedEmail);
      
      if (storedEmail && storedPassword) {
        console.log('🔑 Found stored credentials - attempting auto-login...');
        
        try {
          // Auto-login with stored credentials with 15-second timeout (only for auto-login)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auto-login timeout')), 15000)
          );
          
          const loginPromise = login(storedEmail, storedPassword);
          const loginResult = await Promise.race([loginPromise, timeoutPromise]);
          
          if (loginResult.success) {
            console.log('✅ Auto-login successful!');
          } else {
            console.log('❌ Auto-login failed:', loginResult.error);
            // Clear invalid credentials
            try {
              await AsyncStorage.multiRemove(['login_email', 'login_password']);
            } catch (e) {
              // Fallback to localStorage clear
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem('login_email');
                window.localStorage.removeItem('login_password');
              }
            }
          }
        } catch (autoLoginError) {
          console.log('❌ Auto-login timed out or failed:', autoLoginError.message);
          // Clear credentials on timeout
          try {
            await AsyncStorage.multiRemove(['login_email', 'login_password']);
          } catch (e) {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem('login_email');
              window.localStorage.removeItem('login_password');
            }
          }
        }
      } else {
        console.log('🔍 No stored credentials found - will show auth screen');
      }
    } catch (error) {
      console.error('Error in credential check:', error);
    } finally {
      console.log('🏁 Auth check completed, setting isLoading to false');
      setIsLoading(false);
    }
  }, []); // Remove login dependency to fix circular reference

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

      console.log('🔐 LOGIN ATTEMPT:');
      console.log('  - API_BASE_URL:', API_BASE_URL);
      console.log('  - Login URL:', `${API_BASE_URL}/api/auth/login`);
      console.log('  - Email:', email);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('📡 RESPONSE RECEIVED:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Content-Type:', response.headers.get('content-type'));

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Non-JSON response received:', contentType);
        const textResponse = await response.text();
        console.error('❌ Response body:', textResponse);
        return { success: false, error: 'Server returned invalid response. Please check your internet connection.' };
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Login failed:', data.detail || 'Unknown error');
        return { success: false, error: data.detail || 'Login failed' };
      }

  // Store auth data AND credentials for auto-login
      await AsyncStorage.setItem('auth_token', data.access_token).catch(async (asyncError) => {
        console.error('AsyncStorage failed, using localStorage fallback:', asyncError);
        // Fallback to localStorage for web environment
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('auth_token', data.access_token);
          window.localStorage.setItem('auth_user', JSON.stringify(data.user));
          window.localStorage.setItem('login_email', email);
          window.localStorage.setItem('login_password', password);
        }
      });
      
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user)).catch((error) => {
        console.error('AsyncStorage user storage failed:', error);
      });
      
      // Store credentials for auto-login
      await AsyncStorage.setItem('login_email', email).catch(() => {});
      await AsyncStorage.setItem('login_password', password).catch(() => {});
      
      setToken(data.access_token);
      setUser(data.user);

      console.log('✅ Login successful - SETTING AUTH STATE:');
      console.log('  - User ID:', data.user.id);
      console.log('  - User email:', data.user.email);
      console.log('  - Token set:', !!data.access_token);
      console.log('  - Token preview:', data.access_token.substring(0, 15) + '...');
      
      // Force state verification
      setTimeout(() => {
        console.log('🔍 AUTH STATE VERIFICATION (1s after login):');
        console.log('  - user state:', !!user);
        console.log('  - token state:', !!token);
        console.log('  - isAuthenticated calculated:', !!(user && token));
      }, 1000);

      console.log('✅ Login successful - User ID:', data.user.id, 'Credentials stored for auto-login');

      return { success: true };
    } catch (error) {
      console.error('❌ LOGIN ERROR DETAILS:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      
      // More specific error handling
      if (error.message.includes('JSON')) {
        console.error('❌ JSON Parse Error - Server likely returned HTML instead of JSON');
        return { success: false, error: 'Server communication error. Please check your connection and try again.' };
      }
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        console.error('❌ Network Error - Check internet connection');
        return { success: false, error: 'Network error. Please check your internet connection and try again.' };
      }
      
      console.error('❌ Unknown error type:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
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

      // Store auth data AND credentials for auto-login
      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      
      // Store credentials for auto-login with web fallback
      try {
        await AsyncStorage.setItem('login_email', email);
        await AsyncStorage.setItem('login_password', password);
      } catch (asyncError) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('auth_token', data.access_token);
          window.localStorage.setItem('auth_user', JSON.stringify(data.user));
          window.localStorage.setItem('login_email', email);
          window.localStorage.setItem('login_password', password);
          console.log('Stored credentials in localStorage for web compatibility');
        }
      }
      
      setToken(data.access_token);
      setUser(data.user);

      console.log('✅ Registration successful - User ID:', data.user.id, 'Credentials stored for auto-login');

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
      // Check if we're in web environment
      if (typeof window !== 'undefined' && window.location) {
        // Web environment - use redirect
        const redirectUrl = encodeURIComponent(window.location.href);
        const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
        
        // Open Google auth in new window/tab
        window.open(googleAuthUrl, '_self');
        
        return { success: true };
      } else {
        // Mobile environment - show message
        console.log('Google OAuth not available in mobile environment');
        return { success: false, error: 'Google login not available in mobile app' };
      }
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

  const contextValue = React.useMemo(() => ({
    user,
    token,
    isLoading: actualIsLoading,  // Use combined loading state
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    checkSession,
  }), [user, token, actualIsLoading, isAuthenticated, login, register, loginWithGoogle, logout, checkSession]);

  return (
    <AuthContext.Provider value={contextValue}>
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