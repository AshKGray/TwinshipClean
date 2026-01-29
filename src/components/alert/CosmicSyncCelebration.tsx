/**
 * Cosmic Sync Celebration Component
 *
 * Animated celebration modal for simultaneous alert detection.
 * Story: 3-5 Simultaneous Alert Detection
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import NeonButton from '../common/NeonButton';
import { triggerHaptic } from '../../theme/haptics';
import type { CosmicSyncMoment } from '../../types/alert';

const { width, height } = Dimensions.get('window');

interface CosmicSyncCelebrationProps {
  visible: boolean;
  syncMoment: CosmicSyncMoment | null;
  onClose: () => void;
}

const CosmicSyncCelebration: React.FC<CosmicSyncCelebrationProps> = ({
  visible,
  syncMoment,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      triggerHaptic('success');

      // Animate entrance
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
      });

      opacity.value = withTiming(1, { duration: 300 });

      glowIntensity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withDelay(
          200,
          withTiming(0.5, { duration: 1000 })
        )
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
      glowIntensity.value = 0;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value * 0.8,
    shadowRadius: glowIntensity.value * 30,
  }));

  if (!syncMoment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.container,
            animatedContainerStyle,
            animatedGlowStyle,
          ]}
        >
          {/* Celebration content */}
          <View style={styles.content}>
            {/* Main emoji */}
            <Text style={styles.mainEmoji}>✨</Text>

            {/* Title */}
            <Text style={styles.title}>Cosmic Sync Moment!</Text>

            {/* Description */}
            <Text style={styles.description}>
              You and your twin sent alerts at the same time!
            </Text>

            {/* Time difference */}
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>
                {syncMoment.timeDifferenceSeconds < 1
                  ? 'Simultaneously'
                  : `${syncMoment.timeDifferenceSeconds}s apart`}
              </Text>
            </View>

            {/* Fun fact */}
            <Text style={styles.funFact}>
              Twin telepathy confirmed! 🔮
            </Text>

            {/* Close button */}
            <NeonButton
              variant="primary"
              accentColor="stellar-blue"
              onPress={onClose}
              fullWidth
              hapticFeedback="medium"
              testID="sync-celebration-close"
            >
              Amazing!
            </NeonButton>
          </View>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00D4FF',
    padding: 24,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  content: {
    alignItems: 'center',
  },
  mainEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  timeBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D4FF',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D4FF',
  },
  funFact: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default CosmicSyncCelebration;
