import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MythicTechColors } from '../theme/MythicTechTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LogoutConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({ 
  visible, 
  onConfirm, 
  onCancel, 
  userName = 'Player' 
}: LogoutConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[MythicTechColors.deepVoid, MythicTechColors.shadowGrid]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="log-out-outline" size={32} color={MythicTechColors.neonPink} />
              </View>
              <Text style={styles.title}>Logout Confirmation</Text>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                Are you sure you want to logout?
              </Text>
              <Text style={styles.userInfo}>
                User: <Text style={styles.userName}>{userName}</Text>
              </Text>
              <Text style={styles.warningText}>
                Your progress will be saved automatically.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onConfirm}
              >
                <LinearGradient
                  colors={[MythicTechColors.plasmaGlow, MythicTechColors.neonPink]}
                  style={styles.logoutGradient}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(320, SCREEN_WIDTH * 0.9),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: MythicTechColors.neonPink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalGradient: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MythicTechColors.shadowGrid,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: MythicTechColors.neonPink + '44',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MythicTechColors.neonPink,
    textAlign: 'center',
    textShadowColor: MythicTechColors.neonPink + '88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: MythicTechColors.neonCyan,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  userInfo: {
    fontSize: 14,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    marginBottom: 8,
  },
  userName: {
    color: MythicTechColors.neonPink,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: MythicTechColors.voidSilver,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: MythicTechColors.shadowGrid,
    borderWidth: 1,
    borderColor: MythicTechColors.voidSilver + '44',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: MythicTechColors.voidSilver,
  },
  logoutButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MythicTechColors.darkSpace,
  },
});