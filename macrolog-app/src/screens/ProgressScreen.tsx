import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../services/storage';
import { Meal, UserSettings } from '../types';
import {
  getTotalsForDate,
  getLast7Days,
  formatDate,
  isToday,
  formatDateDisplay,
  formatTimeDisplay,
  getHealthRating,
  getHealthScoreEmoji,
  isGoalMet,
  getMealsForDate,
  calculateStreak,
  getDayName,
} from '../utils/helpers';

export default function ProgressScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const selectedDateTotals = getTotalsForDate(meals, selectedDate);
  const selectedDateMeals = getMealsForDate(meals, selectedDate);
  const last7Days = getLast7Days();
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
          <Text style={styles.title}>Progress</Text>

          {/* Streak Display */}
          {currentStreak > 0 && (
            <Text style={styles.streakText}>
              🔥 {currentStreak} days | Best: {settings.streak.longestStreak}
            </Text>
          )}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeDate(-1)}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dateDisplay}>
            <Text style={styles.dateLabel}>
              {isToday(selectedDate) ? 'Today' : formatDateDisplay(selectedDate)}
            </Text>
            <Text style={styles.dayLabel}>{getDayName(selectedDate)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, isToday(selectedDate) && styles.navButtonDisabled]}
            onPress={() => changeDate(1)}
            disabled={isToday(selectedDate)}
          >
            <Text style={[styles.navButtonText, isToday(selectedDate) && styles.navButtonTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Date Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>
            {isToday(selectedDate) ? "Today's Total" : formatDateDisplay(selectedDate)}
          </Text>
          <View style={styles.caloriesRow}>
            <Text style={styles.caloriesLarge}>{selectedDateTotals.calories}</Text>
            <Text style={styles.caloriesGoal}>/ {settings.daily_goals.calories}</Text>
          </View>
          <Text style={styles.caloriesLabel}>calories</Text>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (selectedDateTotals.calories / settings.daily_goals.calories) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>

          {/* Macros Grid */}
          <View style={styles.macrosGrid}>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{selectedDateTotals.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroGoal}>Goal: {settings.daily_goals.protein}g</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{selectedDateTotals.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroGoal}>Goal: {settings.daily_goals.carbs}g</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{selectedDateTotals.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroGoal}>Goal: {settings.daily_goals.fat}g</Text>
            </View>
          </View>

          {/* Health Rating */}
          {selectedDateTotals.avgHealthScore > 0 && (
            <View style={styles.healthRating}>
              <View>
                <Text style={styles.healthLabel}>Health Rating</Text>
                <Text style={styles.healthValue}>
                  {getHealthRating(selectedDateTotals.avgHealthScore)}
                </Text>
              </View>
              <Text style={styles.healthEmoji}>
                {getHealthScoreEmoji(selectedDateTotals.avgHealthScore)}
              </Text>
            </View>
          )}
        </View>

        {/* 7-Day Overview */}
        <Text style={styles.sectionTitle}>LAST 7 DAYS</Text>
        <View style={styles.weekCard}>
          {last7Days.map((day) => {
            const dayTotals = getTotalsForDate(meals, day);
            const goalMet = isGoalMet(dayTotals, settings.daily_goals);
            const isSelected = formatDate(day) === formatDate(selectedDate);

            return (
              <TouchableOpacity
                key={formatDate(day)}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <View style={styles.dayButtonLeft}>
                  <Text style={[styles.dayButtonDate, isSelected && styles.dayButtonDateSelected]}>
                    {isToday(day)
                      ? 'Today'
                      : day.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                  </Text>
                  <Text style={styles.dayButtonMeals}>
                    {dayTotals.meals} meals
                    {dayTotals.avgHealthScore > 0 && (
                      <Text style={styles.dayButtonHealth}>
                        {' '}• {getHealthRating(dayTotals.avgHealthScore)}
                      </Text>
                    )}
                  </Text>
                </View>

                <View style={styles.dayButtonRight}>
                  <View style={styles.dayButtonStats}>
                    <Text
                      style={[
                        styles.dayButtonCalories,
                        goalMet && styles.dayButtonCaloriesGoalMet,
                        dayTotals.calories === 0 && styles.dayButtonCaloriesEmpty,
                      ]}
                    >
                      {dayTotals.calories || '—'}
                    </Text>
                    <Text style={styles.dayButtonGoal}>of {settings.daily_goals.calories}</Text>
                  </View>

                  {dayTotals.calories > 0 && (
                    <Text style={styles.dayButtonEmoji}>{goalMet ? '✅' : '📊'}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Meals for Selected Date */}
        <Text style={styles.sectionTitle}>
          MEALS {isToday(selectedDate) ? 'TODAY' : `ON ${formatDateDisplay(selectedDate).toUpperCase()}`}
        </Text>

        {selectedDateMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No meals logged</Text>
            <Text style={styles.emptyText}>
              {isToday(selectedDate) ? 'Tap the camera to get started' : 'No data for this date'}
            </Text>
          </View>
        ) : (
          <View style={styles.mealsContainer}>
            {selectedDateMeals.map(meal => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <View style={styles.mealTitleRow}>
                      <Text style={styles.mealTitle}>{meal.items.length} items</Text>
                      {meal.healthScore && (
                        <View style={styles.healthBadge}>
                          <Text style={styles.healthBadgeText}>
                            {getHealthRating(meal.healthScore)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.mealTime}>
                      {formatTimeDisplay(new Date(meal.timestamp))}
                    </Text>
                  </View>
                  <View style={styles.mealCalories}>
                    <Text style={styles.mealCaloriesValue}>{meal.totalCalories}</Text>
                    <Text style={styles.mealCaloriesLabel}>cal</Text>
                  </View>
                </View>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealMacro}>P: {meal.totalProtein}g</Text>
                  <Text style={styles.mealMacro}>C: {meal.totalCarbs}g</Text>
                  <Text style={styles.mealMacro}>F: {meal.totalFat}g</Text>
                  {settings.appleHealth.enabled && (
                    <Text style={styles.mealMacro}>
                      {meal.syncedToAppleHealth ? '❤️ Synced' : '⏳ Not synced'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
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
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  navButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    fontSize: 24,
    color: '#4B5563',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  summaryDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  caloriesLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  caloriesGoal: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 8,
    marginLeft: 8,
  },
  caloriesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  macroBox: {
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  macroLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  macroGoal: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  healthRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  healthLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  healthEmoji: {
    fontSize: 36,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  dayButtonLeft: {
    flex: 1,
  },
  dayButtonDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dayButtonDateSelected: {
    color: '#3B82F6',
  },
  dayButtonMeals: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dayButtonHealth: {
    fontWeight: '500',
  },
  dayButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayButtonStats: {
    alignItems: 'flex-end',
  },
  dayButtonCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  dayButtonCaloriesGoalMet: {
    color: '#059669',
  },
  dayButtonCaloriesEmpty: {
    color: '#D1D5DB',
  },
  dayButtonGoal: {
    fontSize: 12,
    color: '#6B7280',
  },
  dayButtonEmoji: {
    fontSize: 20,
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  healthBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  mealTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  mealCaloriesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  mealCaloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 16,
  },
  mealMacro: {
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
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
