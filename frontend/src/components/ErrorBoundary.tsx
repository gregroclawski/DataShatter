import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.log('🚨 ErrorBoundary caught error:', error.name, error.message);
    
    // If it's the React static flag error, we'll try to recover
    if (error.message?.includes('static flag') || 
        error.message?.includes('react_1.use') ||
        error.message?.includes('Internal React error')) {
      console.log('🔧 Attempting to recover from React internal error');
      return { hasError: false }; // Try to recover
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary - Error details:', error);
    console.error('🚨 ErrorBoundary - Error info:', errorInfo);
    
    // For React internal errors, try to recover after a short delay
    if (error.message?.includes('static flag') || 
        error.message?.includes('react_1.use') ||
        error.message?.includes('Internal React error')) {
      setTimeout(() => {
        console.log('🔄 Attempting error recovery...');
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  handleRetry = () => {
    console.log('🔄 Manual error recovery triggered');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>MYTHIC-TECH</Text>
            <Text style={styles.subtitle}>System Recovery</Text>
            <Text style={styles.errorText}>
              Ninja systems encountered a temporary error
            </Text>
            <Text style={styles.errorDetails}>
              {this.state.error.name}: {this.state.error.message}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 30,
    borderWidth: 2,
    borderColor: '#00d4ff',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorDetails: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});