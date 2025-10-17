import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../services/storage';
import { HealthKitService } from '../services/health';
import { UserSettings, DailyGoals } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempGoals, setTempGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await StorageService.getSettings();
      setSettings(loadedSettings);
      setTempApiKey(loadedSettings.openai_api_key || '');
      setTempGoals(loadedSettings.daily_goals);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      await StorageService.updateApiKey(tempApiKey.trim());
      setSettings(prev => prev ? { ...prev, openai_api_key: tempApiKey.trim() } : null);
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const saveGoals = async () => {
    if (tempGoals.calories <= 0 || tempGoals.protein <= 0 || tempGoals.carbs <= 0 || tempGoals.fat <= 0) {
      Alert.alert('Error', 'All goals must be greater than 0');
      return;
    }

    try {
      await StorageService.updateDailyGoals(tempGoals);
      setSettings(prev => prev ? { ...prev, daily_goals: tempGoals } : null);
      Alert.alert('Success', 'Daily goals saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save daily goals');
    }
  };

  const openApiKeyGuide = () => {
    Linking.openURL('https://platform.openai.com/api-keys');
  };

  const toggleAppleHealth = async () => {
    if (!settings) return;

    // Check if HealthKit is available
    if (!HealthKitService.isAvailable()) {
      Alert.alert(
        'Not Available',
        'Apple Health is not available on this device. HealthKit is only available on iOS devices.'
      );
      return;
    }

    if (!settings.appleHealth.enabled) {
      // User wants to enable - request permissions
      const granted = await HealthKitService.requestPermissions();

      if (granted) {
        const updatedSettings = {
          ...settings,
          appleHealth: {
            enabled: true,
            permissionGranted: true,
            lastSyncAttempt: null,
            syncErrors: 0,
          },
        };
        await StorageService.saveSettings(updatedSettings);
        setSettings(updatedSettings);
        Alert.alert(
          'Success',
          'Apple Health integration enabled. Your meals will now sync to the Health app.'
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'Apple Health permissions are required to sync nutrition data. You can enable permissions in your device Settings.'
        );
      }
    } else {
      // User wants to disable
      Alert.alert(
        'Disable Apple Health',
        'Are you sure you want to disable Apple Health sync? Your existing data in the Health app will not be removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              const updatedSettings = {
                ...settings,
                appleHealth: {
                  ...settings.appleHealth,
                  enabled: false,
                },
              };
              await StorageService.saveSettings(updatedSettings);
              setSettings(updatedSettings);
            },
          },
        ]
      );
    }
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const apiKeyChanged = tempApiKey !== (settings.openai_api_key || '');
  const goalsChanged = JSON.stringify(tempGoals) !== JSON.stringify(settings.daily_goals);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OPENAI CONFIGURATION</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>🔑</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>API Key</Text>
                <Text style={styles.cardSubtitle}>Required for food analysis</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempApiKey}
                onChangeText={setTempApiKey}
                placeholder="sk-..."
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowApiKey(!showApiKey)}
              >
                <Text style={styles.eyeEmoji}>{showApiKey ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, !apiKeyChanged && styles.buttonDisabled]}
              onPress={saveApiKey}
              disabled={!apiKeyChanged}
            >
              <Text style={[styles.buttonText, !apiKeyChanged && styles.buttonTextDisabled]}>
                Save API Key
              </Text>
            </TouchableOpacity>

            {settings.openai_api_key && (
              <View style={styles.successBadge}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successText}>API key configured</Text>
              </View>
            )}

            <TouchableOpacity style={styles.linkButton} onPress={openApiKeyGuide}>
              <Text style={styles.linkText}>How to get an API key →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DAILY GOALS</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.goalInput}>
              <Text style={styles.goalLabel}>Calories</Text>
              <TextInput
                style={styles.goalField}
                value={tempGoals.calories.toString()}
                onChangeText={(text) => setTempGoals({ ...tempGoals, calories: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.macrosRow}>
              <View style={styles.macroInput}>
                <Text style={styles.goalLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.goalField}
                  value={tempGoals.protein.toString()}
                  onChangeText={(text) =>
                    setTempGoals({ ...tempGoals, protein: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.goalLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.goalField}
                  value={tempGoals.carbs.toString()}
                  onChangeText={(text) =>
                    setTempGoals({ ...tempGoals, carbs: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.goalLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.goalField}
                  value={tempGoals.fat.toString()}
                  onChangeText={(text) =>
                    setTempGoals({ ...tempGoals, fat: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="65"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, !goalsChanged && styles.buttonDisabled]}
              onPress={saveGoals}
              disabled={!goalsChanged}
            >
              <Text style={[styles.buttonText, !goalsChanged && styles.buttonTextDisabled]}>
                Save Goals
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apple Health Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>APPLE HEALTH</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>❤️</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Health App Sync</Text>
                <Text style={styles.cardSubtitle}>
                  {settings.appleHealth.enabled
                    ? 'Syncing nutrition data'
                    : 'Sync meals to Apple Health'}
                </Text>
              </View>
              <Switch
                value={settings.appleHealth.enabled}
                onValueChange={toggleAppleHealth}
                trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                thumbColor={settings.appleHealth.enabled ? '#059669' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {!HealthKitService.isAvailable() && (
              <View style={styles.warningBox}>
                <Text style={styles.warningEmoji}>ℹ️</Text>
                <Text style={styles.warningBoxText}>
                  Apple Health is only available on iOS devices.
                </Text>
              </View>
            )}

            {settings.appleHealth.enabled && settings.appleHealth.permissionGranted && (
              <View style={styles.successBadge}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successText}>
                  Meals will automatically sync to Apple Health
                </Text>
              </View>
            )}

            {settings.appleHealth.syncErrors > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.errorBoxText}>
                  {settings.appleHealth.syncErrors} sync error
                  {settings.appleHealth.syncErrors > 1 ? 's' : ''} occurred
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                When enabled, MacroLog will write your meal nutrition data (calories, protein,
                carbs, and fat) to the Apple Health app after each meal is logged.
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>🔥 {settings.streak.currentStreak} days</Text>
              <Text style={styles.streakBest}>
                Personal Best: {settings.streak.longestStreak} days
              </Text>
            </View>

            <View style={styles.achievementsGrid}>
              {settings.achievements.map(achievement => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementBadge,
                    !achievement.unlocked && styles.achievementBadgeLocked,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                  <Text
                    style={[
                      styles.achievementName,
                      !achievement.unlocked && styles.achievementNameLocked,
                    ]}
                  >
                    {achievement.name}
                  </Text>
                  <Text style={styles.achievementThreshold}>{achievement.threshold} days</Text>
                  {achievement.unlocked && achievement.unlockedDate && (
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.unlockedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appEmoji}>🍽️</Text>
          <Text style={styles.appName}>MacroLog</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#111827',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  eyeEmoji: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  successEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  successText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  goalInput: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  goalField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  macroInput: {
    flex: 1,
  },
  streakInfo: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  streakBest: {
    fontSize: 14,
    color: '#6B7280',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '31%',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  achievementBadgeLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  achievementThreshold: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 9,
    color: '#6B7280',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  appEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
