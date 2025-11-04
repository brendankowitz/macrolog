import Foundation
import SwiftUI

// MARK: - Health Score Helpers
func getHealthScoreEmoji(_ score: Int) -> String {
    switch score {
    case 90...100:
        return "🟢" // Nutritious
    case 70...89:
        return "🟡" // Good
    case 50...69:
        return "🟠" // Fair
    default:
        return "🔴" // Limited
    }
}

func getHealthScoreBadgeColor(_ score: Int) -> Color {
    switch score {
    case 90...100:
        return Color.green
    case 70...89:
        return Color.blue
    case 50...69:
        return Color.orange
    default:
        return Color.red
    }
}

func getHealthRating(_ score: Int) -> String {
    switch score {
    case 90...100:
        return "Nutritious"
    case 70...89:
        return "Good"
    case 50...69:
        return "Fair"
    default:
        return "Limited"
    }
}

// MARK: - Streak Calculation
func calculateStreak(meals: [Meal]) -> (currentStreak: Int, lastLoggedDate: Date?) {
    guard !meals.isEmpty else {
        return (0, nil)
    }

    let sortedMeals = meals.sorted { $0.timestamp > $1.timestamp }
    var currentStreak = 0
    var lastCheckedDate: Date?

    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())

    for meal in sortedMeals {
        let mealDate = calendar.startOfDay(for: meal.timestamp)

        if lastCheckedDate == nil {
            // First meal
            if mealDate == today {
                currentStreak = 1
                lastCheckedDate = mealDate
            } else {
                // Latest meal wasn't today, streak is broken
                break
            }
        } else if let lastDate = lastCheckedDate {
            let daysBefore = calendar.dateComponents([.day], from: mealDate, to: lastDate).day ?? 0

            if daysBefore == 1 {
                // Consecutive day
                currentStreak += 1
                lastCheckedDate = mealDate
            } else {
                // Streak broken
                break
            }
        }
    }

    return (currentStreak, lastCheckedDate)
}

// MARK: - Date Formatting
func formatTimeDisplay(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "h:mm a"
    return formatter.string(from: date)
}

func formatDateDisplay(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d, yyyy"
    return formatter.string(from: date)
}

func formatDayOfWeek(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "EEEE"
    return formatter.string(from: date)
}

// MARK: - Image Utilities
func imageToBase64(_ imageData: Data) -> String {
    return imageData.base64EncodedString()
}

// MARK: - Calculation Helpers
func calculateTotals(for meals: [Meal], on date: Date) -> (
    calories: Int,
    protein: Int,
    carbs: Int,
    fat: Int,
    avgHealthScore: Int
) {
    let calendar = Calendar.current
    let targetDate = calendar.startOfDay(for: date)

    let mealsThatDay = meals.filter {
        calendar.startOfDay(for: $0.timestamp) == targetDate
    }

    guard !mealsThatDay.isEmpty else {
        return (0, 0, 0, 0, 0)
    }

    let totalCalories = mealsThatDay.reduce(0) { $0 + $1.totalCalories }
    let totalProtein = mealsThatDay.reduce(0) { $0 + $1.totalProtein }
    let totalCarbs = mealsThatDay.reduce(0) { $0 + $1.totalCarbs }
    let totalFat = mealsThatDay.reduce(0) { $0 + $1.totalFat }
    let avgHealthScore = mealsThatDay.map { $0.healthScore }.reduce(0, +) / mealsThatDay.count

    return (totalCalories, totalProtein, totalCarbs, totalFat, avgHealthScore)
}

// MARK: - Achievement Helpers
func checkForAchievementUnlocks(
    _ currentStreak: Int,
    in settings: UserSettings
) -> Achievement? {
    for achievement in settings.achievements {
        if !achievement.unlocked && currentStreak >= achievement.threshold {
            return achievement
        }
    }
    return nil
}
