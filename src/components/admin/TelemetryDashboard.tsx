/**
 * Telemetry Dashboard - Admin Analytics Interface
 * Privacy-first dashboard for assessment norming and quality monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryBar, VictoryPie, VictoryAxis } from 'victory-native';
import { useTelemetryStore, selectTelemetryStatus, selectQualityIndicators } from '../../state/telemetryStore';
import { statisticalNorming } from '../../utils/statisticalNorming';
import { telemetryService } from '../../services/telemetryService';
import { TelemetryAlert, TelemetryDashboardData } from '../../types/telemetry';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface DashboardProps {
  isAdmin?: boolean;
  onExportData?: () => void;
  onPrivacySettings?: () => void;
}

const TelemetryDashboard: React.FC<DashboardProps> = ({
  isAdmin = false,
  onExportData,
  onPrivacySettings,
}) => {
  const {
    dashboardData,
    alerts,
    performanceMetrics,
    userConsent,
    config,
    normingStatistics,
    itemAnalyses,
    updateDashboardData,
    resolveAlert,
    clearAlerts,
  } = useTelemetryStore();

  const telemetryStatus = selectTelemetryStatus();
  const qualityIndicators = selectQualityIndicators();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'quality' | 'anomalies' | 'performance'>('completion');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load dashboard data on mount and when time range changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    if (!userConsent || telemetryStatus !== 'enabled') return;

    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Generate dashboard data (in production, this would come from backend)
      const data = statisticalNorming.generateDashboardData(
        startDate.toISOString(),
        endDate.toISOString()
      );

      updateDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleExportData = () => {
    if (onExportData) {
      onExportData();
    } else {
      // Default export functionality
      const exportData = useTelemetryStore.getState().getPrivacyCompliantData();
      Alert.alert(
        'Export Data',
        'Analytics data has been prepared for export.\nNote: All data is anonymized and privacy-compliant.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Export', 
            onPress: () => {
              // In production, this would trigger actual export
              console.log('Exporting data:', JSON.stringify(exportData, null, 2));
            }
          }
        ]
      );
    }
  };

  const renderStatusCard = () => {
    const statusColors = {
      enabled: '#10B981',
      disabled: '#6B7280',
      consent_required: '#F59E0B',
      error: '#EF4444',
    };

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold text-gray-900">System Status</Text>
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusColors[telemetryStatus] + '20' }}
          >
            <Text 
              className="text-sm font-medium"
              style={{ color: statusColors[telemetryStatus] }}
            >
              {telemetryStatus.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {performanceMetrics.dataQualityScore.toFixed(2)}
            </Text>
            <Text className="text-sm text-gray-500">Data Quality</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {((1 - performanceMetrics.anomalyRate) * 100).toFixed(1)}%
            </Text>
            <Text className="text-sm text-gray-500">Data Validity</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {dashboardData?.overview.totalSessions || 0}
            </Text>
            <Text className="text-sm text-gray-500">Total Sessions</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderOverviewCards = () => {
    if (!dashboardData?.overview) return null;

    const { overview } = dashboardData;

    return (
      <View className="flex-row flex-wrap mb-4">
        <View className="w-1/2 pr-2 mb-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-2xl font-bold text-blue-600">
              {overview.completedAssessments}
            </Text>
            <Text className="text-sm text-gray-500">Completed</Text>
            <Text className="text-xs text-gray-400 mt-1">
              {(overview.completionRate * 100).toFixed(1)}% rate
            </Text>
          </View>
        </View>
        
        <View className="w-1/2 pl-2 mb-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-2xl font-bold text-green-600">
              {Math.round(overview.averageCompletionTime / 1000 / 60)}m
            </Text>
            <Text className="text-sm text-gray-500">Avg Time</Text>
            <Text className="text-xs text-gray-400 mt-1">Per assessment</Text>
          </View>
        </View>
        
        <View className="w-1/2 pr-2">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-2xl font-bold text-purple-600">
              {(overview.dataQualityScore * 100).toFixed(0)}%
            </Text>
            <Text className="text-sm text-gray-500">Quality</Text>
            <Text className="text-xs text-gray-400 mt-1">Data integrity</Text>
          </View>
        </View>
        
        <View className="w-1/2 pl-2">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-2xl font-bold text-orange-600">
              {(overview.anomalyRate * 100).toFixed(1)}%
            </Text>
            <Text className="text-sm text-gray-500">Anomalies</Text>
            <Text className="text-xs text-gray-400 mt-1">Flagged responses</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeRangeSelector = () => {
    const ranges = [
      { key: '24h', label: '24h' },
      { key: '7d', label: '7d' },
      { key: '30d', label: '30d' },
      { key: '90d', label: '90d' },
    ] as const;

    return (
      <View className="flex-row bg-gray-100 rounded-lg p-1 mb-4">
        {ranges.map((range) => (
          <TouchableOpacity
            key={range.key}
            className={`flex-1 py-2 rounded-md ${
              selectedTimeRange === range.key ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setSelectedTimeRange(range.key)}
          >
            <Text 
              className={`text-center text-sm font-medium ${
                selectedTimeRange === range.key ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!dashboardData?.trendsData.length) {
      return (
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Trends</Text>
          <View className="py-8 items-center">
            <Text className="text-gray-500">No trend data available</Text>
          </View>
        </View>
      );
    }

    const data = dashboardData.trendsData.map((point, index) => ({
      x: index,
      y: selectedMetric === 'completion' ? point.completionRate * 100 :
         selectedMetric === 'quality' ? point.averageQuality * 100 :
         selectedMetric === 'anomalies' ? point.anomalyRate * 100 :
         point.averageQuality * 100, // default to quality
    }));

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Trends</Text>
          <View className="flex-row bg-gray-100 rounded-lg">
            {(['completion', 'quality', 'anomalies'] as const).map((metric) => (
              <TouchableOpacity
                key={metric}
                className={`px-3 py-1 rounded-md ${
                  selectedMetric === metric ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text 
                  className={`text-xs font-medium ${
                    selectedMetric === metric ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={{ height: 200 }}>
          <VictoryChart
            width={chartWidth}
            height={200}
            padding={{ left: 50, top: 20, right: 20, bottom: 50 }}
          >
            <VictoryAxis dependentAxis />
            <VictoryAxis />
            <VictoryArea
              data={data}
              style={{
                data: { fill: "#3B82F6", fillOpacity: 0.1, stroke: "#3B82F6", strokeWidth: 2 }
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryChart>
        </View>
      </View>
    );
  };

  const renderQualityDistribution = () => {
    if (!dashboardData?.qualityIndicators) return null;

    const { qualityIndicators } = dashboardData;
    const data = [
      { x: 'Straight Line', y: qualityIndicators.straightLineResponding * 100 },
      { x: 'Too Fast', y: qualityIndicators.excessiveSpeed * 100 },
      { x: 'Inconsistent', y: qualityIndicators.inconsistentPatterns * 100 },
      { x: 'Technical', y: qualityIndicators.technicalIssues * 100 },
    ];

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Data Quality Issues
        </Text>
        
        <View style={{ height: 200 }}>
          <VictoryChart
            width={chartWidth}
            height={200}
            padding={{ left: 80, top: 20, right: 20, bottom: 50 }}
          >
            <VictoryAxis />
            <VictoryAxis dependentAxis />
            <VictoryBar
              data={data}
              x="x"
              y="y"
              style={{
                data: { fill: "#EF4444", fillOpacity: 0.8 }
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryChart>
        </View>
      </View>
    );
  };

  const renderActiveAlerts = () => {
    const activeAlerts = alerts.filter(alert => !alert.resolved);
    
    if (activeAlerts.length === 0) {
      return (
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-2">Active Alerts</Text>
          <View className="flex-row items-center py-4">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <Text className="text-gray-600">All systems operating normally</Text>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            Active Alerts ({activeAlerts.length})
          </Text>
          {isAdmin && activeAlerts.length > 0 && (
            <TouchableOpacity
              onPress={clearAlerts}
              className="px-3 py-1 bg-red-100 rounded-lg"
            >
              <Text className="text-red-600 text-sm font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {activeAlerts.slice(0, 5).map((alert) => (
          <View key={alert.id} className="border-l-4 border-red-400 bg-red-50 p-3 mb-2 rounded-r-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium text-red-800">
                  {alert.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text className="text-red-700 text-sm mt-1">
                  {alert.message}
                </Text>
                <Text className="text-red-600 text-xs mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </Text>
              </View>
              
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => resolveAlert(alert.id)}
                  className="px-2 py-1 bg-red-200 rounded"
                >
                  <Text className="text-red-800 text-xs">Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderItemAnalytics = () => {
    const analyses = Array.from(itemAnalyses.values()).slice(0, 10);
    
    if (analyses.length === 0) return null;

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Item Performance
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View className="flex-row border-b border-gray-200 pb-2 mb-2">
              <Text className="w-20 text-sm font-medium text-gray-700">Item</Text>
              <Text className="w-20 text-sm font-medium text-gray-700">Difficulty</Text>
              <Text className="w-24 text-sm font-medium text-gray-700">Discrimination</Text>
              <Text className="w-16 text-sm font-medium text-gray-700">Flagged</Text>
            </View>
            
            {/* Data rows */}
            {analyses.map((analysis) => (
              <View key={analysis.questionId} className="flex-row py-2 border-b border-gray-100">
                <Text className="w-20 text-sm text-gray-900">
                  {analysis.questionId.slice(-6)}
                </Text>
                <Text className="w-20 text-sm text-gray-900">
                  {analysis.difficulty.toFixed(2)}
                </Text>
                <Text className="w-24 text-sm text-gray-900">
                  {analysis.discrimination.toFixed(2)}
                </Text>
                <View className="w-16">
                  {analysis.flagged ? (
                    <View className="w-2 h-2 bg-red-500 rounded-full" />
                  ) : (
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!isAdmin) return null;

    return (
      <View className="flex-row mb-4">
        <TouchableOpacity
          onPress={handleExportData}
          className="flex-1 bg-blue-600 py-3 px-4 rounded-lg mr-2"
        >
          <Text className="text-white font-medium text-center">Export Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onPrivacySettings}
          className="flex-1 bg-gray-600 py-3 px-4 rounded-lg ml-2"
        >
          <Text className="text-white font-medium text-center">Privacy Settings</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Don't render if telemetry is disabled or consent not given
  if (telemetryStatus === 'disabled' || (config.consentRequired && !userConsent)) {
    return (
      <View className="flex-1 bg-gray-100 p-4">
        <View className="bg-white rounded-lg p-8 items-center justify-center">
          <Text className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Analytics Unavailable
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            {telemetryStatus === 'disabled' 
              ? 'Telemetry is currently disabled. Enable analytics to view assessment data.'
              : 'User consent is required to view analytics data. Please update privacy settings.'
            }
          </Text>
          
          {onPrivacySettings && (
            <TouchableOpacity
              onPress={onPrivacySettings}
              className="bg-blue-600 py-3 px-6 rounded-lg"
            >
              <Text className="text-white font-medium">Privacy Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderStatusCard()}
        {renderActionButtons()}
        {renderTimeRangeSelector()}
        {renderOverviewCards()}
        {renderTrendChart()}
        {renderActiveAlerts()}
        {renderQualityDistribution()}
        {renderItemAnalytics()}
        
        {/* Privacy Notice */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <Text className="text-blue-800 font-medium text-sm mb-1">
            Privacy Notice
          </Text>
          <Text className="text-blue-700 text-xs">
            All data shown is anonymized and aggregated. No personally identifiable 
            information is collected or displayed. Data collection follows GDPR guidelines.
          </Text>
        </View>
        
        {/* Last updated */}
        <Text className="text-gray-500 text-xs text-center mt-4">
          Last updated: {new Date(performanceMetrics.lastUpdated).toLocaleString()}
        </Text>
      </ScrollView>
    </View>
  );
};

export default TelemetryDashboard;