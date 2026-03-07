import { UserSettings, Meal, Achievement, DailyGoals, StreakData } from '../types';

const KEYS = {
  SETTINGS: '@macrolog_settings',
  MEALS: '@macrolog_meals',
};

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
  openrouter_api_key: null,
  analysis_mode: 'premium',
  appearance: 'system',
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
  async getSettings(): Promise<UserSettings> {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        // Migrate legacy openai_api_key field
        if (parsed.openai_api_key && !parsed.openrouter_api_key) {
          parsed.openrouter_api_key = parsed.openai_api_key;
          delete parsed.openai_api_key;
        }
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
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async updateApiKey(apiKey: string): Promise<void> {
    const settings = await this.getSettings();
    settings.openrouter_api_key = apiKey;
    await this.saveSettings(settings);
  },

  async updateAnalysisMode(mode: 'premium' | 'free'): Promise<void> {
    const settings = await this.getSettings();
    settings.analysis_mode = mode;
    await this.saveSettings(settings);
  },

  async updateAppearance(appearance: 'system' | 'light' | 'dark'): Promise<void> {
    const settings = await this.getSettings();
    settings.appearance = appearance;
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

  async getMeals(): Promise<Meal[]> {
    try {
      const data = localStorage.getItem(KEYS.MEALS);
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
      meals.unshift(meal);
      localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
  },

  async updateMeal(mealId: string, items: import('../types').FoodItem[], notes?: string): Promise<void> {
    const meals = await this.getMeals();
    const idx = meals.findIndex(m => m.id === mealId);
    if (idx === -1) return;
    const meal = meals[idx];
    meal.items = items;
    meal.notes = notes;
    meal.totalCalories = items.reduce((s, i) => s + i.calories, 0);
    meal.totalProtein  = items.reduce((s, i) => s + i.protein, 0);
    meal.totalCarbs    = items.reduce((s, i) => s + i.carbs, 0);
    meal.totalFat      = items.reduce((s, i) => s + i.fat, 0);
    meal.healthScore   = Math.round(items.reduce((s, i) => s + i.healthScore, 0) / items.length);
    localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
  },

  async deleteMeal(mealId: string): Promise<void> {
    try {
      const meals = await this.getMeals();
      const filtered = meals.filter(m => m.id !== mealId);
      localStorage.setItem(KEYS.MEALS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.removeItem(KEYS.MEALS);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};
