import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwinStore } from '../state/twinStore';
import { useTwintuitionStore } from '../state/twintuitionStore';
import { useTwintuition } from '../hooks/useTwintuition';
import { getNeonAccentColor, getNeonGradientColors } from '../utils/neonColors';

interface TwintuitionSettingsCardProps {
  onViewHistory?: () => void;
}

export const TwintuitionSettingsCard: React.FC<TwintuitionSettingsCardProps> = ({
  onViewHistory,
}) => {
  const { userProfile } = useTwinStore();
  const { config, notificationPrefs } = useTwintuitionStore();
  const {
    updateSensitivity,
    updateTimeWindow,
    enableLocationSync,
    getSyncScore,
    syncScore,
  } = useTwintuition();

  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const primaryColor = getNeonAccentColor(accentColor);
  const [color1, color2, color3] = getNeonGradientColors(accentColor);

  const handleLocationToggle = async (enabled: boolean) => {
    setLoading(true);
    const success = await enableLocationSync(enabled);
    if (!success && enabled) {
      // Show error message or prompt
      console.warn('Location permission required for location sync');
    }
    setLoading(false);
  };

  const handleSensitivityChange = (value: number) => {
    updateSensitivity(value);
  };

  const handleTimeWindowChange = (minutes: number) => {
    updateTimeWindow(minutes);
  };

  const refreshSyncScore = async () => {
    setLoading(true);
    await getSyncScore();
    setLoading(false);
  };

  const getSensitivityLabel = (sensitivity: number) => {
    if (sensitivity >= 0.8) return 'Very High';
    if (sensitivity >= 0.6) return 'High';
    if (sensitivity >= 0.4) return 'Medium';
    if (sensitivity >= 0.2) return 'Low';
    return 'Very Low';
  };

  const renderSensitivityButtons = () => {
    const levels = [
      { label: 'Low', value: 0.3 },
      { label: 'Medium', value: 0.6 },
      { label: 'High', value: 0.8 },
    ];

    return (
      <View style={styles.buttonGroup}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.levelButton,
              config.sensitivity === level.value && {
                backgroundColor: primaryColor,
              },
            ]}
            onPress={() => handleSensitivityChange(level.value)}
          >
            <Text
              style={[
                styles.levelButtonText,
                config.sensitivity === level.value && styles.selectedButtonText,
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTimeWindowButtons = () => {
    const windows = [
      { label: '5 min', value: 5 },
      { label: '15 min', value: 15 },
      { label: '30 min', value: 30 },
      { label: '1 hour', value: 60 },
    ];

    return (
      <View style={styles.buttonGroup}>
        {windows.map((window) => (
          <TouchableOpacity
            key={window.value}
            style={[
              styles.timeButton,
              config.timeWindowMinutes === window.value && {
                backgroundColor: primaryColor,
              },
            ]}
            onPress={() => handleTimeWindowChange(window.value)}
          >
            <Text
              style={[
                styles.levelButtonText,
                config.timeWindowMinutes === window.value && styles.selectedButtonText,
              ]}
            >
              {window.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <BlurView intensity={20} style={styles.container}>
      <LinearGradient
        colors={[`${color1}20`, `${color2}30`, `${color3}20`]}
        style={styles.content}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.icon}>✨</Text>
            <View>
              <Text style={styles.title}>Twintuition Alerts</Text>
              <Text style={styles.subtitle}>
                Sync Score: {syncScore} | Sensitivity: {getSensitivityLabel(config.sensitivity)}
              </Text>
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: primaryColor }]}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Sync Score Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Twin Connection Score</Text>
                <TouchableOpacity
                  onPress={refreshSyncScore}
                  disabled={loading}
                  style={[styles.refreshButton, { borderColor: primaryColor }]}
                >
                  <Text style={[styles.refreshButtonText, { color: primaryColor }]}>
                    {loading ? 'Loading...' : 'Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.scoreValue, { color: primaryColor }]}>
                {syncScore}/100
              </Text>
              {onViewHistory && (
                <TouchableOpacity
                  onPress={onViewHistory}
                  style={[styles.historyButton, { backgroundColor: primaryColor }]}
                >
                  <Text style={styles.historyButtonText}>View History</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Detection Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detection Sensitivity</Text>
              <Text style={styles.description}>
                Higher sensitivity detects more subtle connections but may include false positives.
              </Text>
              {renderSensitivityButtons()}
            </View>

            {/* Time Window Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Window</Text>
              <Text style={styles.description}>
                How long to look for matching behaviors between twins.
              </Text>
              {renderTimeWindowButtons()}
            </View>

            {/* Feature Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Features</Text>
              
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>Location Sync</Text>
                  <Text style={styles.toggleDescription}>
                    Detect when you're in similar places
                  </Text>
                </View>
                <Switch
                  value={config.enableLocationSync}
                  onValueChange={handleLocationToggle}
                  trackColor={{ false: '#767577', true: `${primaryColor}80` }}
                  thumbColor={config.enableLocationSync ? primaryColor : '#f4f3f4'}
                  disabled={loading}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>Mood Sync</Text>
                  <Text style={styles.toggleDescription}>
                    Track emotional synchronicity
                  </Text>
                </View>
                <Switch
                  value={config.enableMoodSync}
                  onValueChange={(enabled) => {
                    // Update config through store
                    useTwintuitionStore.getState().updateConfig({ enableMoodSync: enabled });
                  }}
                  trackColor={{ false: '#767577', true: `${primaryColor}80` }}
                  thumbColor={config.enableMoodSync ? primaryColor : '#f4f3f4'}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>Action Sync</Text>
                  <Text style={styles.toggleDescription}>
                    Detect simultaneous actions
                  </Text>
                </View>
                <Switch
                  value={config.enableActionSync}
                  onValueChange={(enabled) => {
                    useTwintuitionStore.getState().updateConfig({ enableActionSync: enabled });
                  }}
                  trackColor={{ false: '#767577', true: `${primaryColor}80` }}
                  thumbColor={config.enableActionSync ? primaryColor : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacySection}>
              <Text style={styles.privacyTitle}>🔒 Privacy & Ethics</Text>
              <Text style={styles.privacyText}>
                All behavior analysis is processed locally on your device. Location data is anonymized. 
                You can opt out at any time, and data is never shared without your explicit consent.
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginVertical: 10,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 15,
    lineHeight: 18,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  historyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  selectedButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 15,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  privacySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
});