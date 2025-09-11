import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwinStore, TwintuitionAlert as TwintuitionAlertType } from '../state/twinStore';
import { getNeonAccentColor, getNeonGradientColors } from '../utils/neonColors';

interface TwintuitionAlertProps {
  alert: TwintuitionAlertType | null;
  visible: boolean;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

const { width, height } = Dimensions.get('window');

export const TwintuitionAlert: React.FC<TwintuitionAlertProps> = ({
  alert,
  visible,
  onDismiss,
  onViewDetails,
}) => {
  const { userProfile, markAlertAsRead } = useTwinStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && alert) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: false,
            }),
          ])
        ),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [visible, alert]);

  const handleDismiss = () => {
    if (alert) {
      markAlertAsRead(alert.id);
    }
    
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleViewDetails = () => {
    if (alert) {
      markAlertAsRead(alert.id);
    }
    onViewDetails?.();
    handleDismiss();
  };

  if (!alert || !visible) {
    return null;
  }

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const primaryColor = getNeonAccentColor(accentColor);
  const [color1, color2, color3] = getNeonGradientColors(accentColor);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'feeling':
        return '💫';
      case 'thought':
        return '🧠';
      case 'action':
        return '⚡';
      default:
        return '✨';
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'feeling':
        return 'Emotional Sync';
      case 'thought':
        return 'Mental Connection';
      case 'action':
        return 'Synchronized Action';
      default:
        return 'Twin Connection';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <BlurView intensity={50} style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Glow Effect */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                shadowColor: primaryColor,
                shadowOpacity: glowAnim,
                shadowRadius: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 30],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[color1, color2, color3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{getAlertIcon(alert.type)}</Text>
                  <Animated.View
                    style={[
                      styles.iconGlow,
                      {
                        backgroundColor: primaryColor,
                        opacity: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.6],
                        }),
                      },
                    ]}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Twintuition Alert</Text>
                  <Text style={styles.subtitle}>{getAlertTypeText(alert.type)}</Text>
                </View>
              </View>

              {/* Message */}
              <View style={styles.messageContainer}>
                <Text style={styles.message}>{alert.message}</Text>
                <Text style={styles.timestamp}>
                  {new Date(alert.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton]}
                  onPress={handleDismiss}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.actionButton,
                    { backgroundColor: primaryColor },
                  ]}
                  onPress={handleViewDetails}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>View History</Text>
                </TouchableOpacity>
              </View>

              {/* Decorative Elements */}
              <View style={styles.decorativeElements}>
                <View style={[styles.sparkle, { backgroundColor: color1 }]} />
                <View style={[styles.sparkle, styles.sparkle2, { backgroundColor: color2 }]} />
                <View style={[styles.sparkle, styles.sparkle3, { backgroundColor: color3 }]} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 350,
  },
  glowContainer: {
    borderRadius: 25,
    elevation: 10,
  },
  alertContent: {
    borderRadius: 25,
    padding: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  icon: {
    fontSize: 40,
    textAlign: 'center',
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -5,
    left: -5,
    zIndex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  messageContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  sparkle2: {
    top: '20%',
    right: '15%',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparkle3: {
    bottom: '25%',
    left: '20%',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});