import { HealthRating, Meal, DayTotals, DailyGoals } from '../types';

export const getHealthScoreColor = (score: number): string => {
  if (score >= 90) return '#059669'; // green
  if (score >= 70) return '#2563EB'; // blue
  if (score >= 50) return '#D97706'; // yellow
  return '#EA580C'; // orange
};

export const getHealthRating = (score: number): HealthRating => {
  if (score >= 90) return 'Nutritious';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Limited';
};

export const getHealthScoreEmoji = (score: number): string => {
  if (score >= 90) return '🌟';
  if (score >= 70) return '✅';
  if (score >= 50) return '👍';
  return '⚠️';
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDate(date) === formatDate(today);
};

export const getLast7Days = (): Date[] => {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
};

export const getMealsForDate = (meals: Meal[], date: Date): Meal[] => {
  const dateStr = formatDate(date);
  return meals.filter(meal => {
    const mealDate = new Date(meal.timestamp);
    return formatDate(mealDate) === dateStr;
  });
};

export const getTotalsForDate = (meals: Meal[], date: Date): DayTotals => {
  const dayMeals = getMealsForDate(meals, date);
  return {
    calories: dayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0),
    protein: dayMeals.reduce((sum, meal) => sum + meal.totalProtein, 0),
    carbs: dayMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0),
    fat: dayMeals.reduce((sum, meal) => sum + meal.totalFat, 0),
    meals: dayMeals.length,
    avgHealthScore:
      dayMeals.length > 0
        ? Math.round(
            dayMeals.reduce((sum, meal) => sum + (meal.healthScore || 0), 0) /
              dayMeals.length
          )
        : 0,
  };
};

export const isGoalMet = (
  totals: DayTotals,
  goals: DailyGoals
): boolean => {
  return (
    totals.calories >= goals.calories * 0.9 &&
    totals.calories <= goals.calories * 1.1
  );
};

export const calculateStreak = (meals: Meal[]): { currentStreak: number; lastLoggedDate: string | null } => {
  if (meals.length === 0) {
    return { currentStreak: 0, lastLoggedDate: null };
  }

  // Sort meals by date, newest first
  const sortedMeals = [...meals].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get unique dates that have meals
  const uniqueDates = Array.from(
    new Set(sortedMeals.map(meal => formatDate(new Date(meal.timestamp))))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, lastLoggedDate: null };
  }

  const lastLoggedDate = uniqueDates[0];
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  // If last log was not today or yesterday, streak is broken
  if (lastLoggedDate !== today && lastLoggedDate !== yesterday) {
    return { currentStreak: 0, lastLoggedDate };
  }

  // Calculate streak
  let streak = 0;
  let currentDate = new Date(lastLoggedDate);

  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = formatDate(currentDate);
    if (uniqueDates[i] === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak: streak, lastLoggedDate };
};

export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export const formatTimeDisplay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDayName = (date: Date): string => {
  if (isToday(date)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};
