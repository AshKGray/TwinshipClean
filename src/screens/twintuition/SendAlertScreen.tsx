/**
 * Send Alert Screen
 *
 * Screen for sending a twintuition alert to your twin.
 * Story: 3-2 Send Twintuition Alert with Emotion Recognition
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NeonButton from '../../components/common/NeonButton';
import AlertTypeCard from '../../components/alert/AlertTypeCard';
import { alertService } from '../../services/alertService';
import { useAlertSelectors } from '../../state/alertStore';
import { useTwinStore } from '../../state/twinStore';
import type { TwintuitionAlertType } from '../../types/alert';
import { triggerHaptic } from '../../theme/haptics';

interface SendAlertScreenProps {
  navigation: any;
}

const EMOTIONS = [
  { value: 'happy', label: '😊 Happy', color: '#FFB347' },
  { value: 'excited', label: '🤩 Excited', color: '#00D4FF' },
  { value: 'calm', label: '😌 Calm', color: '#8FD14F' },
  { value: 'anxious', label: '😰 Anxious', color: '#FF6B9D' },
  { value: 'sad', label: '😢 Sad', color: '#7073FE' },
  { value: 'grateful', label: '🙏 Grateful', color: '#D4AF37' },
];

const ALERT_TYPES: TwintuitionAlertType[] = [
  'thinking_of_you',
  'need_support',
  'sharing_joy',
  'feeling_sync',
  'random_check_in',
];

const SendAlertScreen: React.FC<SendAlertScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<TwintuitionAlertType | null>(null);
  const [message, setMessage] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const twinProfile = useTwinStore(state => state.twinProfile);
  const userProfile = useTwinStore(state => state.userProfile);
  const { canSendAlert, getNextAvailableSendTime } = useAlertSelectors();

  const handleSend = async () => {
    if (!selectedType) {
      Alert.alert('Select Alert Type', 'Please select an alert type before sending');
      return;
    }

    if (!twinProfile) {
      Alert.alert('No Twin Connected', 'You need to pair with your twin first');
      return;
    }

    // Check cooldown
    if (!canSendAlert(5)) {
      const nextTime = getNextAvailableSendTime(5);
      const minutesLeft = nextTime
        ? Math.ceil((nextTime.getTime() - new Date().getTime()) / (1000 * 60))
        : 0;

      Alert.alert(
        'Cooldown Active',
        `Please wait ${minutesLeft} more minute${minutesLeft !== 1 ? 's' : ''} before sending another alert`
      );
      return;
    }

    setIsSending(true);

    try {
      await alertService.sendAlert(selectedType, twinProfile.id, {
        message: message.trim() || undefined,
        emotion: selectedEmotion || undefined,
      });

      triggerHaptic('success');

      Alert.alert(
        'Alert Sent! ✨',
        `Your ${selectedType.replace(/_/g, ' ')} alert has been sent to ${twinProfile.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert(
        'Send Failed',
        'Failed to send alert. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Send Twintuition Alert</Text>
              <Text style={styles.subtitle}>
                {twinProfile ? `To: ${twinProfile.name}` : 'No twin connected'}
              </Text>
            </View>

            {/* Alert Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Alert Type</Text>
              {ALERT_TYPES.map(type => (
                <AlertTypeCard
                  key={type}
                  type={type}
                  selected={selectedType === type}
                  onPress={setSelectedType}
                  testID={`alert-type-${type}`}
                />
              ))}
            </View>

            {/* Optional Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Message (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                End-to-end encrypted
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Add a personal note..."
                  placeholderTextColor="#6B7280"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={200}
                  testID="alert-message-input"
                />
                <Text style={styles.charCount}>{message.length}/200</Text>
              </View>
            </View>

            {/* Emotion Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Mood (Optional)</Text>
              <View style={styles.emotionGrid}>
                {EMOTIONS.map(emotion => (
                  <NeonButton
                    key={emotion.value}
                    variant={selectedEmotion === emotion.value ? 'primary' : 'outline'}
                    size="small"
                    accentColor="stellar-blue"
                    onPress={() => setSelectedEmotion(
                      selectedEmotion === emotion.value ? null : emotion.value
                    )}
                    testID={`emotion-${emotion.value}`}
                    style={styles.emotionButton}
                  >
                    {emotion.label}
                  </NeonButton>
                ))}
              </View>
            </View>

            {/* Send Button */}
            <View style={styles.sendSection}>
              <NeonButton
                variant="primary"
                size="large"
                accentColor="stellar-blue"
                onPress={handleSend}
                loading={isSending}
                disabled={!selectedType || !twinProfile}
                fullWidth
                hapticFeedback="success"
                testID="send-alert-button"
              >
                Send Alert ✨
              </NeonButton>

              <NeonButton
                variant="ghost"
                size="medium"
                accentColor="stellar-blue"
                onPress={() => navigation.goBack()}
                disabled={isSending}
                fullWidth
                testID="cancel-button"
              >
                Cancel
              </NeonButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    padding: 12,
  },
  input: {
    fontSize: 16,
    color: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionButton: {
    flexBasis: '48%',
  },
  sendSection: {
    gap: 12,
    marginTop: 8,
    marginBottom: 40,
  },
});

export default SendAlertScreen;
