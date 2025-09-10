import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResearchStudy, ConsentItem } from '../../types/research';

interface ConsentFormProps {
  study: ResearchStudy;
  onConsent: (consentItems: ConsentItem[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({
  study,
  onConsent,
  onCancel,
  isLoading = false
}) => {
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([
    {
      id: 'data_collection',
      title: 'Data Collection Agreement',
      description: `I consent to the collection and use of my anonymized data for the "${study.title}" research study.`,
      required: true,
      consented: false,
      dataTypes: study.dataTypes.map(dt => dt.type)
    },
    {
      id: 'data_sharing',
      title: 'Academic Data Sharing',
      description: 'I consent to sharing my anonymized data with qualified academic researchers.',
      required: true,
      consented: false,
      dataTypes: ['academic']
    },
    {
      id: 'contact_research',
      title: 'Research Updates',
      description: 'I consent to receive updates about research findings and publications.',
      required: false,
      consented: false,
      dataTypes: ['communication']
    },
    {
      id: 'future_contact',
      title: 'Future Studies',
      description: 'I consent to be contacted about related future research opportunities.',
      required: false,
      consented: false,
      dataTypes: ['communication']
    }
  ]);

  const toggleConsent = (itemId: string) => {
    setConsentItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, consented: !item.consented } : item
    ));
  };

  const canProceed = consentItems
    .filter(item => item.required)
    .every(item => item.consented);

  const handleSubmit = () => {
    if (canProceed) {
      onConsent(consentItems);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black/90" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="p-6 border-b border-white/20">
        <Text className="text-white text-2xl font-bold mb-2">Informed Consent</Text>
        <Text className="text-white/70 text-lg">{study.title}</Text>
      </View>

      {/* Study Information */}
      <View className="p-6 space-y-6">
        {/* Purpose */}
        <View>
          <Text className="text-white text-lg font-semibold mb-2">Study Purpose</Text>
          <Text className="text-white/80 leading-6">{study.fullDescription}</Text>
        </View>

        {/* What We Collect */}
        <View>
          <Text className="text-white text-lg font-semibold mb-3">Data We Collect</Text>
          <View className="space-y-3">
            {study.dataTypes.map((dataType, index) => (
              <View key={index} className="bg-white/5 rounded-lg p-4">
                <Text className="text-white font-medium capitalize mb-1">
                  {dataType.type} Data
                </Text>
                <Text className="text-white/70 text-sm mb-2">
                  {dataType.description}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <View className="bg-purple-500/20 px-2 py-1 rounded">
                    <Text className="text-purple-300 text-xs">
                      {dataType.anonymizationLevel}
                    </Text>
                  </View>
                  <View className="bg-blue-500/20 px-2 py-1 rounded">
                    <Text className="text-blue-300 text-xs">
                      {dataType.retentionPeriod}
                    </Text>
                  </View>
                  <View className="bg-green-500/20 px-2 py-1 rounded">
                    <Text className="text-green-300 text-xs">
                      {dataType.sharingScope}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits & Compensation */}
        <View>
          <Text className="text-white text-lg font-semibold mb-3">Benefits & Compensation</Text>
          <View className="space-y-2">
            {study.compensation.map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <Ionicons name="gift" size={16} color="#8b5cf6" />
                <Text className="text-white/80 ml-2">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Risks & Privacy */}
        <View>
          <Text className="text-white text-lg font-semibold mb-3">Privacy & Risks</Text>
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
            <Text className="text-amber-300 font-medium">What you should know:</Text>
            <Text className="text-white/80 text-sm">
              • All data is fully anonymized before analysis
            </Text>
            <Text className="text-white/80 text-sm">
              • No personal identifying information is shared
            </Text>
            <Text className="text-white/80 text-sm">
              • You can withdraw from the study at any time
            </Text>
            <Text className="text-white/80 text-sm">
              • Data retention follows research ethics guidelines
            </Text>
            <Text className="text-white/80 text-sm">
              • Minimal risk - similar to everyday app usage
            </Text>
          </View>
        </View>

        {/* Research Team */}
        <View>
          <Text className="text-white text-lg font-semibold mb-3">Research Team</Text>
          <View className="bg-white/5 rounded-lg p-4">
            <Text className="text-white font-medium">{study.leadResearcher}</Text>
            <Text className="text-white/70">{study.institution}</Text>
            <Text className="text-white/50 text-sm mt-1">
              Ethics Approval: {study.ethicsApproval}
            </Text>
          </View>
        </View>

        {/* Consent Items */}
        <View>
          <Text className="text-white text-lg font-semibold mb-4">Your Consent</Text>
          <View className="space-y-4">
            {consentItems.map((item) => (
              <View key={item.id} className="bg-white/5 rounded-lg p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-white font-medium">{item.title}</Text>
                      {item.required && (
                        <Text className="text-red-400 text-sm ml-2">*required</Text>
                      )}
                    </View>
                    <Text className="text-white/70 text-sm leading-5">
                      {item.description}
                    </Text>
                  </View>
                  <Switch
                    value={item.consented}
                    onValueChange={() => toggleConsent(item.id)}
                    trackColor={{ false: '#374151', true: '#8b5cf6' }}
                    thumbColor={item.consented ? '#ffffff' : '#9ca3af'}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Your Rights */}
        <View>
          <Text className="text-white text-lg font-semibold mb-3">Your Rights</Text>
          <View className="bg-white/5 rounded-lg p-4 space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-white/80 text-sm ml-2">
                Withdraw from the study at any time without penalty
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-white/80 text-sm ml-2">
                Request a copy of your contributed data
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-white/80 text-sm ml-2">
                Ask questions about the research at any time
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-white/80 text-sm ml-2">
                Receive summaries of research findings
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-6 space-y-3">
        <Pressable
          onPress={handleSubmit}
          disabled={!canProceed || isLoading}
          className={`py-4 rounded-xl items-center ${
            canProceed && !isLoading
              ? 'bg-purple-500'
              : 'bg-gray-600'
          }`}
        >
          <Text className={`text-lg font-semibold ${
            canProceed && !isLoading ? 'text-white' : 'text-gray-400'
          }`}>
            {isLoading ? 'Processing...' : 'I Agree - Join Study'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          disabled={isLoading}
          className="py-4 rounded-xl items-center bg-white/10"
        >
          <Text className="text-white text-lg font-semibold">Cancel</Text>
        </Pressable>

        {!canProceed && (
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <Text className="text-amber-300 text-sm text-center">
              Please review and accept all required consent items to proceed
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};