/**
 * Alert Type Card Component
 *
 * Displays an alert type option with icon, color, and description.
 * Story: 3-1 Twintuition Alert Types and UI
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import CosmicCard from '../common/CosmicCard';
import { getAlertTypeMetadata, type TwintuitionAlertType } from '../../types/alert';
import { triggerHaptic } from '../../theme/haptics';

interface AlertTypeCardProps {
  type: TwintuitionAlertType;
  selected?: boolean;
  onPress: (type: TwintuitionAlertType) => void;
  testID?: string;
}

const AlertTypeCard: React.FC<AlertTypeCardProps> = ({
  type,
  selected = false,
  onPress,
  testID,
}) => {
  const metadata = getAlertTypeMetadata(type);

  const handlePress = () => {
    triggerHaptic(metadata.hapticPattern);
    onPress(type);
  };

  return (
    <CosmicCard
      elevation={selected ? 3 : 1}
      glowBorder={selected}
      accentColor={metadata.color}
      onPress={handlePress}
      borderRadius={16}
      padding={20}
      testID={testID}
      style={[
        styles.card,
        selected && styles.selectedCard,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{metadata.icon}</Text>
        <Text style={styles.label}>{metadata.label}</Text>
        <Text style={styles.description}>{metadata.description}</Text>
      </View>
    </CosmicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default React.memo(AlertTypeCard);
