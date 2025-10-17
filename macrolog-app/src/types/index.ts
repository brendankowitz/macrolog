// Core data types for MacroLog app

export interface FoodItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  healthBreakdown: {
    nutrientDensity: number;
    processingLevel: number;
    goalAlignment: number;
  };
  healthReason: string;
  encouragement: string;
  editable?: boolean;
}

export interface Meal {
  id: string;
  timestamp: string;
  imageUri: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthScore: number;
  syncedToAppleHealth: boolean;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  threshold: number;
  emoji: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
}

export interface AppleHealthSettings {
  enabled: boolean;
  permissionGranted: boolean;
  lastSyncAttempt: string | null;
  syncErrors: number;
}

export interface UserSettings {
  openai_api_key: string | null;
  daily_goals: DailyGoals;
  streak: StreakData;
  achievements: Achievement[];
  appleHealth: AppleHealthSettings;
}

export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  avgHealthScore: number;
}

export type HealthRating = 'Nutritious' | 'Good' | 'Fair' | 'Limited';

export type TabScreen = 'Home' | 'Progress' | 'Settings';
