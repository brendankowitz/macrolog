import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { StorageService } from '../services/storage';
import { OpenAIService } from '../services/openai';
import { Meal, UserSettings } from '../types';
import {
  getTotalsForDate,
  formatTimeDisplay,
  getHealthScoreEmoji,
  calculateStreak,
} from '../utils/helpers';
import { convertImageToBase64 } from '../utils/imageUtils';

export default function HomeScreen({ navigation }: any) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [loadedSettings, loadedMeals] = await Promise.all([
        StorageService.getSettings(),
        StorageService.getMeals(),
      ]);
      setSettings(loadedSettings);
      setMeals(loadedMeals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTakePhoto = async () => {
    if (!settings?.openai_api_key) {
      Alert.alert(
        'API Key Required',
        'Please add your OpenAI API key in Settings to enable food analysis.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }]
      );
      return;
    }

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Navigate to analysis screen
        navigation.navigate('MealAnalysis', { imageUri });

        // Start analysis in background
        analyzeMealPhoto(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const analyzeMealPhoto = async (imageUri: string) => {
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(imageUri);

      // Analyze with OpenAI
      const foodItems = await OpenAIService.analyzeMealPhoto(
        base64Image,
        settings!.openai_api_key!,
        settings!.daily_goals
      );

      // Navigate to review screen
      navigation.navigate('MealReview', {
        imageUri,
        foodItems,
        dailyGoals: settings!.daily_goals,
      });
    } catch (error) {
      console.error('Error analyzing meal:', error);
      navigation.goBack(); // Go back from analysis screen

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [{ text: 'OK' }]
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

  const todayTotals = getTotalsForDate(meals, new Date());
  const todayMeals = meals.filter(meal => {
    const mealDate = new Date(meal.timestamp);
    return mealDate.toDateString() === new Date().toDateString();
  }).slice(0, 3);

  const { currentStreak } = calculateStreak(meals);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MacroLog</Text>
          <Text style={styles.subtitle}>Snap, analyze, track</Text>
        </View>

        {/* Streak Display */}
        {currentStreak > 0 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakText}>
              🔥 {currentStreak} day {currentStreak === 1 ? 'streak' : 'streak'}
            </Text>
          </View>
        )}

        {/* API Key Warning */}
        {!settings.openai_api_key && (
          <View style={styles.warningCard}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>API Key Required</Text>
              <Text style={styles.warningText}>
                Add your OpenAI API key in Settings to enable food analysis
              </Text>
            </View>
          </View>
        )}

        {/* Camera Button */}
        <TouchableOpacity
          style={[styles.cameraButton, !settings.openai_api_key && styles.cameraButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={!settings.openai_api_key}
        >
          <Text style={styles.cameraIcon}>📸</Text>
          <View>
            <Text style={styles.cameraButtonTitle}>Take Photo</Text>
            <Text style={styles.cameraButtonSubtitle}>Analyze your meal</Text>
          </View>
        </TouchableOpacity>

        {/* Today's Stats */}
        {todayMeals.length > 0 && (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Text style={styles.statsLabel}>TODAY</Text>
                {todayTotals.avgHealthScore > 0 && (
                  <Text style={styles.healthBadge}>
                    {getHealthScoreEmoji(todayTotals.avgHealthScore)} {todayTotals.avgHealthScore}
                  </Text>
                )}
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{todayTotals.calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                  <Text style={styles.statGoal}>of {settings.daily_goals.calories}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{todayTotals.protein}g</Text>
                  <Text style={styles.statLabel}>Protein</Text>
                  <Text style={styles.statGoal}>of {settings.daily_goals.protein}g</Text>
                </View>
              </View>
            </View>

            {/* Recent Meals */}
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recent</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
                  <Text style={styles.seeAllButton}>See all</Text>
                </TouchableOpacity>
              </View>
              {todayMeals.map(meal => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealContent}>
                    <View>
                      <View style={styles.mealTitleRow}>
                        <Text style={styles.mealTitle}>{meal.items.length} items</Text>
                        {meal.healthScore && (
                          <Text style={styles.mealEmoji}>
                            {getHealthScoreEmoji(meal.healthScore)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.mealTime}>
                        {formatTimeDisplay(new Date(meal.timestamp))}
                      </Text>
                    </View>
                    <View style={styles.mealStats}>
                      <Text style={styles.mealCalories}>{meal.totalCalories}</Text>
                      <Text style={styles.mealCaloriesLabel}>cal</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {todayMeals.length === 0 && settings.openai_api_key && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>Ready to start tracking</Text>
            <Text style={styles.emptyText}>
              Take a photo of your meal and let AI identify the nutrition
            </Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButtonDisabled: {
    opacity: 0.5,
  },
  cameraIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  cameraButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraButtonSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  healthBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  statGoal: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mealEmoji: {
    fontSize: 16,
  },
  mealTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  mealStats: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  mealCaloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
