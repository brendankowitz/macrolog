import Foundation

// MARK: - Food Item Model
struct FoodItem: Identifiable, Codable {
    var id: String
    var name: String
    var amount: Double
    var unit: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var healthScore: Int
    var encouragement: String
    var editable: Bool = false

    init(
        id: String = UUID().uuidString,
        name: String,
        amount: Double,
        unit: String,
        calories: Int,
        protein: Int,
        carbs: Int,
        fat: Int,
        healthScore: Int,
        encouragement: String
    ) {
        self.id = id
        self.name = name
        self.amount = amount
        self.unit = unit
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.healthScore = healthScore
        self.encouragement = encouragement
    }
}

// MARK: - Meal Model
struct Meal: Identifiable, Codable {
    var id: String
    var timestamp: Date
    var imageUri: String
    var items: [FoodItem]
    var totalCalories: Int
    var totalProtein: Int
    var totalCarbs: Int
    var totalFat: Int
    var healthScore: Int
    var syncedToAppleHealth: Bool = false

    init(
        id: String = "meal-\(Date().timeIntervalSince1970)",
        timestamp: Date = Date(),
        imageUri: String,
        items: [FoodItem],
        totalCalories: Int,
        totalProtein: Int,
        totalCarbs: Int,
        totalFat: Int,
        healthScore: Int,
        syncedToAppleHealth: Bool = false
    ) {
        self.id = id
        self.timestamp = timestamp
        self.imageUri = imageUri
        self.items = items
        self.totalCalories = totalCalories
        self.totalProtein = totalProtein
        self.totalCarbs = totalCarbs
        self.totalFat = totalFat
        self.healthScore = healthScore
        self.syncedToAppleHealth = syncedToAppleHealth
    }
}

// MARK: - Daily Goals
struct DailyGoals: Codable {
    var calories: Int = 2000
    var protein: Int = 100
    var carbs: Int = 250
    var fat: Int = 65
}

// MARK: - Achievement
struct Achievement: Identifiable, Codable {
    var id: String
    var name: String
    var description: String
    var threshold: Int
    var emoji: String
    var unlocked: Bool = false
    var unlockedDate: Date? = nil

    init(
        id: String,
        name: String,
        description: String,
        threshold: Int,
        emoji: String,
        unlocked: Bool = false,
        unlockedDate: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.threshold = threshold
        self.emoji = emoji
        self.unlocked = unlocked
        self.unlockedDate = unlockedDate
    }
}

// MARK: - Streak Data
struct StreakData: Codable {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var lastLoggedDate: Date? = nil
}

// MARK: - Apple Health Settings
struct AppleHealthSettings: Codable {
    var enabled: Bool = false
    var permissionGranted: Bool = false
    var syncErrors: Int = 0
    var lastSyncAttempt: Date? = nil
}

// MARK: - User Settings
struct UserSettings: Codable {
    var openai_api_key: String? = nil
    var daily_goals: DailyGoals = DailyGoals()
    var achievements: [Achievement] = Self.defaultAchievements()
    var streak: StreakData = StreakData()
    var appleHealth: AppleHealthSettings = AppleHealthSettings()

    static func defaultAchievements() -> [Achievement] {
        return [
            Achievement(id: "7days", name: "Week Warrior", description: "Log meals for 7 consecutive days", threshold: 7, emoji: "🔥"),
            Achievement(id: "21days", name: "Habit Former", description: "Log meals for 21 consecutive days", threshold: 21, emoji: "💪"),
            Achievement(id: "35days", name: "Committed", description: "Log meals for 35 consecutive days", threshold: 35, emoji: "🎯"),
            Achievement(id: "50days", name: "Elite", description: "Log meals for 50 consecutive days", threshold: 50, emoji: "⭐"),
            Achievement(id: "100days", name: "Century Club", description: "Log meals for 100 consecutive days", threshold: 100, emoji: "🏆"),
            Achievement(id: "365days", name: "Annual Legend", description: "Log meals for 365 consecutive days", threshold: 365, emoji: "👑"),
        ]
    }
}

// MARK: - OpenAI Response Model
struct MealAnalysisResponse: Codable {
    let foods: [FoodItem]
}

// MARK: - Error Types
enum MealTrackingError: LocalizedError {
    case invalidImageUri
    case apiKeyMissing
    case analysisFailedError(String)
    case healthKitError(String)
    case storageError(String)
    case cameraPermissionDenied
    case photoLibraryPermissionDenied

    var errorDescription: String? {
        switch self {
        case .invalidImageUri:
            return "Failed to process image"
        case .apiKeyMissing:
            return "OpenAI API key not configured"
        case .analysisFailedError(let message):
            return "Analysis failed: \(message)"
        case .healthKitError(let message):
            return "HealthKit error: \(message)"
        case .storageError(let message):
            return "Storage error: \(message)"
        case .cameraPermissionDenied:
            return "Camera permission required"
        case .photoLibraryPermissionDenied:
            return "Photo library permission required"
        }
    }
}
