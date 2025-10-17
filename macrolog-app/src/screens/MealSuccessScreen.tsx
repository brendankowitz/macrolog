import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FoodItem, Meal, Achievement } from '../types';
import { StorageService } from '../services/storage';
import { HealthKitService } from '../services/health';
import { saveImageToDocuments } from '../utils/imageUtils';
import { calculateStreak } from '../utils/helpers';
import AchievementCelebration from '../components/AchievementCelebration';

interface Props {
  route: {
    params: {
      imageUri: string;
      foodItems: FoodItem[];
    };
  };
  navigation: any;
}

export default function MealSuccessScreen({ route, navigation }: Props) {
  const { imageUri, foodItems } = route.params;

  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    saveMeal();

    // Checkmark animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const saveMeal = async () => {
    try {
      // Calculate totals
      const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);
      const healthScore = Math.round(
        foodItems.reduce((sum, item) => sum + item.healthScore, 0) / foodItems.length
      );

      // Create meal ID
      const mealId = `meal-${Date.now()}`;

      // Save image to documents
      const savedImageUri = await saveImageToDocuments(imageUri, mealId);

      // Get settings to check Apple Health status
      const settings = await StorageService.getSettings();

      // Try to sync to Apple Health if enabled
      let syncedToAppleHealth = false;
      if (settings.appleHealth.enabled && settings.appleHealth.permissionGranted) {
        try {
          const meal: Meal = {
            id: mealId,
            timestamp: new Date().toISOString(),
            imageUri: savedImageUri,
            items: foodItems,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            healthScore,
            syncedToAppleHealth: false,
          };

          syncedToAppleHealth = await HealthKitService.writeMealToHealth(meal);

          if (!syncedToAppleHealth) {
            // Increment sync error count
            const updatedSettings = {
              ...settings,
              appleHealth: {
                ...settings.appleHealth,
                syncErrors: settings.appleHealth.syncErrors + 1,
                lastSyncAttempt: new Date().toISOString(),
              },
            };
            await StorageService.saveSettings(updatedSettings);
          } else {
            // Reset sync errors on success
            const updatedSettings = {
              ...settings,
              appleHealth: {
                ...settings.appleHealth,
                syncErrors: 0,
                lastSyncAttempt: new Date().toISOString(),
              },
            };
            await StorageService.saveSettings(updatedSettings);
          }
        } catch (error) {
          console.error('Error syncing to Apple Health:', error);
          // Increment sync error count
          const updatedSettings = {
            ...settings,
            appleHealth: {
              ...settings.appleHealth,
              syncErrors: settings.appleHealth.syncErrors + 1,
              lastSyncAttempt: new Date().toISOString(),
            },
          };
          await StorageService.saveSettings(updatedSettings);
        }
      }

      // Create meal object
      const meal: Meal = {
        id: mealId,
        timestamp: new Date().toISOString(),
        imageUri: savedImageUri,
        items: foodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        healthScore,
        syncedToAppleHealth,
      };

      // Save meal
      await StorageService.saveMeal(meal);

      // Update streak
      const allMeals = await StorageService.getMeals();
      const { currentStreak, lastLoggedDate } = calculateStreak(allMeals);
      const currentSettings = await StorageService.getSettings();

      const newLongestStreak = Math.max(currentStreak, currentSettings.streak.longestStreak);

      await StorageService.updateStreak({
        currentStreak,
        longestStreak: newLongestStreak,
        lastLoggedDate,
      });

      // Check for achievement unlocks
      let newlyUnlocked: Achievement | null = null;
      for (const achievement of currentSettings.achievements) {
        if (!achievement.unlocked && currentStreak >= achievement.threshold) {
          await StorageService.unlockAchievement(achievement.id);
          // Show celebration for the first unlocked achievement
          if (!newlyUnlocked) {
            newlyUnlocked = achievement;
          }
        }
      }

      // Show achievement celebration if there's a new unlock
      if (newlyUnlocked) {
        setUnlockedAchievement(newlyUnlocked);
        // Delay showing celebration to let success screen animate first
        setTimeout(() => {
          setShowCelebration(true);
        }, 1500);
        // Navigate after celebration (5 seconds total)
        setTimeout(() => {
          navigation.navigate('Home');
        }, 5000);
      } else {
        // Navigate back to home after 2 seconds if no achievement
        setTimeout(() => {
          navigation.navigate('Home');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      // Still navigate back even if there's an error
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
    }
  };

  const getTotalCalories = () => {
    return foodItems.reduce((sum, item) => sum + item.calories, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          Logged!
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          Your meal has been saved
        </Animated.Text>

        <Animated.View
          style={[
            styles.caloriesCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.caloriesValue}>{getTotalCalories()}</Text>
          <Text style={styles.caloriesLabel}>calories added</Text>
        </Animated.View>
      </View>

      <AchievementCelebration
        visible={showCelebration}
        achievement={unlockedAchievement}
        onClose={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#D1FAE5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#059669',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  caloriesCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  caloriesValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
