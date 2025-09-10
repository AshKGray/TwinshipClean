/**
 * Privacy Consent Modal - GDPR Compliant Telemetry Consent
 * Provides transparent information about data collection and user control
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { useTelemetryStore } from '../../state/telemetryStore';
import { TelemetryConfig, TelemetryPrivacyLevel } from '../../types/telemetry';

interface PrivacyConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConsentChange: (consent: boolean, config?: Partial<TelemetryConfig>) => void;
  initialConsent?: boolean;
  isUpdate?: boolean; // True when updating existing consent
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  visible,
  onClose,
  onConsentChange,
  initialConsent = false,
  isUpdate = false,
}) => {
  const { config: currentConfig, userConsent, consentVersion } = useTelemetryStore();
  
  const [consent, setConsent] = useState(initialConsent || userConsent);
  const [privacyLevel, setPrivacyLevel] = useState<TelemetryPrivacyLevel>(
    currentConfig.privacyLevel || 'anonymous'
  );
  const [collectPerformance, setCollectPerformance] = useState(
    currentConfig.collectPerformanceMetrics
  );
  const [collectAnomalies, setCollectAnomalies] = useState(
    currentConfig.collectAnomalyData
  );
  const [collectNorming, setCollectNorming] = useState(
    currentConfig.collectNormingData
  );

  const handleSaveConsent = () => {
    if (consent && (!collectPerformance && !collectAnomalies && !collectNorming)) {
      Alert.alert(
        'Invalid Configuration',
        'If you consent to data collection, at least one data type must be enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newConfig: Partial<TelemetryConfig> = {
      enabled: consent,
      privacyLevel,
      collectPerformanceMetrics: collectPerformance,
      collectAnomalyData: collectAnomalies,
      collectNormingData: collectNorming,
    };

    onConsentChange(consent, newConfig);
    onClose();
  };

  const renderDataCollectionInfo = () => (
    <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <Text className="text-blue-800 font-semibold text-base mb-2">
        What Data Do We Collect?
      </Text>
      <Text className="text-blue-700 text-sm mb-3">
        All data collection is anonymous and designed to improve the scientific validity 
        of our psychological assessments. We never collect personally identifiable information.
      </Text>
      
      <View className="space-y-2">
        <View className="flex-row items-start">
          <Text className="text-blue-600 mr-2">•</Text>
          <Text className="text-blue-700 text-sm flex-1">
            <Text className="font-medium">Response Patterns:</Text> How you answer questions 
            (without the actual answers) to detect data quality issues
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-blue-600 mr-2">•</Text>
          <Text className="text-blue-700 text-sm flex-1">
            <Text className="font-medium">Timing Data:</Text> How long you spend on questions 
            to identify optimal assessment length
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-blue-600 mr-2">•</Text>
          <Text className="text-blue-700 text-sm flex-1">
            <Text className="font-medium">Technical Metrics:</Text> App performance data 
            to improve user experience
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-blue-600 mr-2">•</Text>
          <Text className="text-blue-700 text-sm flex-1">
            <Text className="font-medium">Statistical Norms:</Text> Anonymous response 
            distributions to create reliable scoring systems
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPrivacyLevelSelector = () => (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-3">Privacy Level</Text>
      
      <TouchableOpacity
        className={`border-2 rounded-lg p-4 mb-2 ${
          privacyLevel === 'anonymous' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => setPrivacyLevel('anonymous')}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-medium text-gray-900">Anonymous</Text>
          <View className={`w-4 h-4 rounded-full border-2 ${
            privacyLevel === 'anonymous' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`} />
        </View>
        <Text className="text-sm text-gray-600">
          No session linking, maximum privacy protection
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`border-2 rounded-lg p-4 mb-2 ${
          privacyLevel === 'pseudonymous' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => setPrivacyLevel('pseudonymous')}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-medium text-gray-900">Pseudonymous</Text>
          <View className={`w-4 h-4 rounded-full border-2 ${
            privacyLevel === 'pseudonymous' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`} />
        </View>
        <Text className="text-sm text-gray-600">
          Temporary session linking for better analytics, auto-anonymized after 24 hours
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`border-2 rounded-lg p-4 ${
          privacyLevel === 'aggregated_only' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => setPrivacyLevel('aggregated_only')}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-medium text-gray-900">Aggregated Only</Text>
          <View className={`w-4 h-4 rounded-full border-2 ${
            privacyLevel === 'aggregated_only' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`} />
        </View>
        <Text className="text-sm text-gray-600">
          Only aggregate statistics, no individual data points
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDataTypeToggles = () => (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-3">Data Collection Types</Text>
      
      <View className="bg-white border border-gray-200 rounded-lg">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-1 mr-4">
            <Text className="font-medium text-gray-900">Performance Metrics</Text>
            <Text className="text-sm text-gray-600 mt-1">
              App performance, loading times, and technical health data
            </Text>
          </View>
          <Switch
            value={collectPerformance}
            onValueChange={setCollectPerformance}
            disabled={!consent}
          />
        </View>
        
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-1 mr-4">
            <Text className="font-medium text-gray-900">Anomaly Detection</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Response patterns to identify and prevent data quality issues
            </Text>
          </View>
          <Switch
            value={collectAnomalies}
            onValueChange={setCollectAnomalies}
            disabled={!consent}
          />
        </View>
        
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-1 mr-4">
            <Text className="font-medium text-gray-900">Norming Data</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Anonymous response statistics for assessment validation and scoring
            </Text>
          </View>
          <Switch
            value={collectNorming}
            onValueChange={setCollectNorming}
            disabled={!consent}
          />
        </View>
      </View>
    </View>
  );

  const renderBenefitsSection = () => (
    <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <Text className="text-green-800 font-semibold text-base mb-2">
        How This Benefits You
      </Text>
      
      <View className="space-y-2">
        <View className="flex-row items-start">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-green-700 text-sm flex-1">
            <Text className="font-medium">Better Assessments:</Text> More accurate and 
            reliable psychological evaluations
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-green-700 text-sm flex-1">
            <Text className="font-medium">Improved Experience:</Text> Faster app performance 
            and smoother user interface
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-green-700 text-sm flex-1">
            <Text className="font-medium">Scientific Contribution:</Text> Help advance 
            twin psychology research anonymously
          </Text>
        </View>
        
        <View className="flex-row items-start">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-green-700 text-sm flex-1">
            <Text className="font-medium">Quality Assurance:</Text> Automatic detection 
            of assessment issues and improvements
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRightsSection = () => (
    <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <Text className="text-gray-800 font-semibold text-base mb-2">Your Rights</Text>
      
      <View className="space-y-2">
        <Text className="text-gray-700 text-sm">
          • <Text className="font-medium">Withdraw Consent:</Text> Change your mind at any time 
          in Settings
        </Text>
        
        <Text className="text-gray-700 text-sm">
          • <Text className="font-medium">Data Deletion:</Text> Request removal of all your 
          data (within technical limitations)
        </Text>
        
        <Text className="text-gray-700 text-sm">
          • <Text className="font-medium">Transparency:</Text> View exactly what data is 
          collected in real-time
        </Text>
        
        <Text className="text-gray-700 text-sm">
          • <Text className="font-medium">Control:</Text> Customize exactly what types of 
          data you're comfortable sharing
        </Text>
      </View>
    </View>
  );

  const renderConsentToggle = () => (
    <View className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold text-gray-900">
            {isUpdate ? 'Update Consent' : 'Grant Consent'}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            I consent to anonymous data collection to improve Twinship assessments
          </Text>
        </View>
        <Switch
          value={consent}
          onValueChange={setConsent}
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor={consent ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            
            <Text className="text-xl font-semibold text-gray-900">
              {isUpdate ? 'Privacy Settings' : 'Privacy Consent'}
            </Text>
            
            <TouchableOpacity onPress={handleSaveConsent}>
              <Text className="text-blue-600 text-lg font-medium">
                {isUpdate ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {renderDataCollectionInfo()}
          {renderConsentToggle()}
          
          {consent && (
            <>
              {renderPrivacyLevelSelector()}
              {renderDataTypeToggles()}
            </>
          )}
          
          {renderBenefitsSection()}
          {renderRightsSection()}
          
          {/* Legal Notice */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <Text className="text-yellow-800 font-semibold text-sm mb-2">
              Legal Notice
            </Text>
            <Text className="text-yellow-700 text-xs leading-relaxed">
              This data collection complies with GDPR, CCPA, and other privacy regulations. 
              Data is processed lawfully under legitimate interest for research and service 
              improvement. No data is sold to third parties. Data retention follows stated 
              policies with automatic deletion. For questions, contact privacy@twinshipvibe.com.
            </Text>
          </View>
          
          {/* Version Info */}
          <Text className="text-gray-500 text-xs text-center">
            Consent Version: {consentVersion} • Last Updated: {new Date().toLocaleDateString()}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default PrivacyConsentModal;