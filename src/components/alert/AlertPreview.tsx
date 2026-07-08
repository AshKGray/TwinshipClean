/**
 * Alert Preview Component
 *
 * Displays an alert in a list or timeline view.
 * Story: 3-1 Twintuition Alert Types and UI
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import CosmicCard from '../common/CosmicCard';
import { getAlertTypeMetadata, type TwintuitionAlert } from '../../types/alert';
import { formatDistanceToNow } from 'date-fns';

interface AlertPreviewProps {
  alert: TwintuitionAlert;
  currentUserId: string;
  onPress?: (alert: TwintuitionAlert) => void;
  showUnreadIndicator?: boolean;
  testID?: string;
}

const AlertPreview: React.FC<AlertPreviewProps> = ({
  alert,
  currentUserId,
  onPress,
  showUnreadIndicator = true,
  testID,
}) => {
  const metadata = getAlertTypeMetadata(alert.type);
  const isSent = alert.senderId === currentUserId;
  const isUnread = !alert.isRead && !isSent;

  const handlePress = () => {
    if (onPress) {
      onPress(alert);
    }
  };

  return (
    <CosmicCard
      elevation={isUnread ? 2 : 1}
      glowBorder={isUnread && showUnreadIndicator}
      accentColor={metadata.color}
      onPress={onPress ? handlePress : undefined}
      borderRadius={12}
      padding={16}
      testID={testID}
      style={styles.card}
    >
      <View style={styles.content}>
        {/* Icon and type */}
        <View style={styles.header}>
          <Text style={styles.icon}>{metadata.icon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.label}>{metadata.label}</Text>
            <Text style={styles.direction}>
              {isSent ? `To ${alert.receiverId}` : `From ${alert.senderName}`}
            </Text>
          </View>
          {isUnread && showUnreadIndicator && (
            <View style={styles.unreadBadge} />
          )}
        </View>

        {/* Message preview */}
        {alert.message && (
          <Text style={styles.message} numberOfLines={2}>
            {alert.message}
          </Text>
        )}

        {/* Emotion badge */}
        {alert.emotion && (
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionText}>{alert.emotion}</Text>
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </Text>
      </View>
    </CosmicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  direction: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D4FF',
  },
  message: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginLeft: 44,
  },
  emotionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 44,
  },
  emotionText: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 44,
  },
});

export default React.memo(AlertPreview);
