import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, Meal, Achievement, DailyGoals, StreakData, AppleHealthSettings } from '../types';

const KEYS = {
  SETTINGS: '@macrolog_settings',
  MEALS: '@macrolog_meals',
};

// Default achievements list
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'One full week of consistency',
    threshold: 7,
    emoji: '🔥',
    unlocked: false,
  },
  {
    id: 'habit_builder',
    name: 'Habit Builder',
    description: 'Three weeks of tracking',
    threshold: 21,
    emoji: '⭐',
    unlocked: false,
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Five weeks strong',
    threshold: 35,
    emoji: '💪',
    unlocked: false,
  },
  {
    id: 'dedication',
    name: 'Dedication',
    description: '50 days of commitment',
    threshold: 50,
    emoji: '🏆',
    unlocked: false,
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: '100 days milestone',
    threshold: 100,
    emoji: '💎',
    unlocked: false,
  },
  {
    id: 'year_champion',
    name: 'Year Champion',
    description: 'Full year of tracking',
    threshold: 365,
    emoji: '👑',
    unlocked: false,
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  openai_api_key: null,
  daily_goals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: null,
  },
  achievements: DEFAULT_ACHIEVEMENTS,
  appleHealth: {
    enabled: false,
    permissionGranted: false,
    lastSyncAttempt: null,
    syncErrors: 0,
  },
};

export const StorageService = {
  // Settings
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        // Merge with defaults to ensure new fields are present
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          achievements: parsed.achievements || DEFAULT_ACHIEVEMENTS,
        };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async updateApiKey(apiKey: string): Promise<void> {
    const settings = await this.getSettings();
    settings.openai_api_key = apiKey;
    await this.saveSettings(settings);
  },

  async updateDailyGoals(goals: DailyGoals): Promise<void> {
    const settings = await this.getSettings();
    settings.daily_goals = goals;
    await this.saveSettings(settings);
  },

  async updateStreak(streak: StreakData): Promise<void> {
    const settings = await this.getSettings();
    settings.streak = streak;
    await this.saveSettings(settings);
  },

  async unlockAchievement(achievementId: string): Promise<void> {
    const settings = await this.getSettings();
    const achievement = settings.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedDate = new Date().toISOString();
      await this.saveSettings(settings);
    }
  },

  // Meals
  async getMeals(): Promise<Meal[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEALS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading meals:', error);
      return [];
    }
  },

  async saveMeal(meal: Meal): Promise<void> {
    try {
      const meals = await this.getMeals();
      meals.unshift(meal); // Add to beginning
      await AsyncStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
  },

  async deleteMeal(mealId: string): Promise<void> {
    try {
      const meals = await this.getMeals();
      const filtered = meals.filter(m => m.id !== mealId);
      await AsyncStorage.setItem(KEYS.MEALS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.MEALS]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};
