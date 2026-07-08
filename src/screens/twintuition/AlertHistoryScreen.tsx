/**
 * Alert History Screen
 *
 * Timeline view of all sent and received alerts with filtering.
 * Story: 3-4 Twintuition Alert History and Timeline
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import AlertPreview from '../../components/alert/AlertPreview';
import NeonButton from '../../components/common/NeonButton';
import CosmicCard from '../../components/common/CosmicCard';
import { useAlertStore, useAlertSelectors } from '../../state/alertStore';
import { useTwinStore } from '../../state/twinStore';
import { alertService } from '../../services/alertService';
import type { TwintuitionAlert, TwintuitionAlertType } from '../../types/alert';

interface AlertHistoryScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'sent' | 'received' | TwintuitionAlertType;

const AlertHistoryScreen: React.FC<AlertHistoryScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAlert, setSelectedAlert] = useState<TwintuitionAlert | null>(null);

  const alerts = useAlertStore(state => state.alerts);
  const userProfile = useTwinStore(state => state.userProfile);
  const { getSentAlerts, getReceivedAlerts, getAlertsByType } = useAlertSelectors();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // Alerts are loaded via real-time listener in alertService
      // This is just for initial load indication
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = (): TwintuitionAlert[] => {
    if (!userProfile) return [];

    switch (filter) {
      case 'sent':
        return getSentAlerts(userProfile.id);
      case 'received':
        return getReceivedAlerts(userProfile.id);
      case 'all':
        return alerts;
      default:
        return getAlertsByType(filter as TwintuitionAlertType);
    }
  };

  const handleAlertPress = (alert: TwintuitionAlert) => {
    setSelectedAlert(alert);

    // Mark as read if it's a received alert
    if (alert.receiverId === userProfile?.id && !alert.isRead) {
      alertService.markAlertAsRead(alert.id);
    }
  };

  const handleDeleteAlert = async () => {
    if (!selectedAlert) return;

    try {
      await alertService.deleteAlert(selectedAlert.id);
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const renderAlert = ({ item }: { item: TwintuitionAlert }) => (
    <AlertPreview
      alert={item}
      currentUserId={userProfile?.id || ''}
      onPress={handleAlertPress}
      showUnreadIndicator
      testID={`alert-${item.id}`}
    />
  );

  const renderAlertDetail = () => {
    if (!selectedAlert) return null;

    return (
      <CosmicCard
        elevation={3}
        glowBorder
        accentColor="stellar-blue"
        padding={20}
        style={styles.detailCard}
      >
        <Text style={styles.detailTitle}>Alert Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>From:</Text>
          <Text style={styles.detailValue}>{selectedAlert.senderName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>
            {selectedAlert.type.replace(/_/g, ' ')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sent:</Text>
          <Text style={styles.detailValue}>
            {format(new Date(selectedAlert.timestamp), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>

        {selectedAlert.emotion && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mood:</Text>
            <Text style={styles.detailValue}>{selectedAlert.emotion}</Text>
          </View>
        )}

        {selectedAlert.message && (
          <View style={styles.messageSection}>
            <Text style={styles.detailLabel}>Message:</Text>
            <Text style={styles.messageText}>{selectedAlert.message}</Text>
          </View>
        )}

        <View style={styles.detailActions}>
          <NeonButton
            variant="outline"
            size="small"
            accentColor="nebula-rose"
            onPress={handleDeleteAlert}
            testID="delete-alert-button"
          >
            Delete
          </NeonButton>
          <NeonButton
            variant="primary"
            size="small"
            accentColor="stellar-blue"
            onPress={() => setSelectedAlert(null)}
            testID="close-detail-button"
          >
            Close
          </NeonButton>
        </View>
      </CosmicCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No Alerts Yet</Text>
      <Text style={styles.emptyText}>
        Send your first twintuition alert to your twin!
      </Text>
      <NeonButton
        variant="primary"
        accentColor="stellar-blue"
        onPress={() => navigation.navigate('SendAlert')}
        testID="send-first-alert-button"
      >
        Send Alert
      </NeonButton>
    </View>
  );

  const filteredAlerts = getFilteredAlerts();

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Alert History</Text>
          <Text style={styles.subtitle}>{filteredAlerts.length} alerts</Text>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'sent' && styles.filterChipActive]}
            onPress={() => setFilter('sent')}
          >
            <Text style={[styles.filterText, filter === 'sent' && styles.filterTextActive]}>
              Sent
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'received' && styles.filterChipActive]}
            onPress={() => setFilter('received')}
          >
            <Text style={[styles.filterText, filter === 'received' && styles.filterTextActive]}>
              Received
            </Text>
          </Pressable>
        </View>

        {/* Alert Detail Overlay */}
        {selectedAlert && renderAlertDetail()}

        {/* Alert List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4FF" />
          </View>
        ) : (
          <FlatList
            data={filteredAlerts}
            renderItem={renderAlert}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
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
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: '#00D4FF',
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#00D4FF',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailCard: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  messageSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginTop: 8,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default AlertHistoryScreen;
