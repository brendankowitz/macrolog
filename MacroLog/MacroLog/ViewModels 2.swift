import Foundation
import Combine
import HealthKit

// MARK: - Home View Model
@MainActor
class HomeViewModel: ObservableObject {
    @Published var meals: [Meal] = []
    @Published var settings: UserSettings = UserSettings()
    @Published var currentStreak: Int = 0
    @Published var isLoading = true
    @Published var error: String?

    private let storageService = StorageService.shared

    func loadData() {
        isLoading = true
        error = nil

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let meals = try self?.storageService.getMeals() ?? []
                let settings = try self?.storageService.getSettings() ?? UserSettings()
                let (streak, _) = calculateStreak(meals: meals)

                DispatchQueue.main.async {
                    self?.meals = meals
                    self?.settings = settings
                    self?.currentStreak = streak
                    self?.isLoading = false
                }
            } catch {
                DispatchQueue.main.async {
                    self?.error = error.localizedDescription
                    self?.isLoading = false
                }
            }
        }
    }

    func getTodaysTotals() -> (calories: Int, protein: Int, carbs: Int, fat: Int, avgHealthScore: Int) {
        return calculateTotals(for: meals, on: Date())
    }

    func getTodaysMeals() -> [Meal] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        return meals.filter { meal in
            calendar.startOfDay(for: meal.timestamp) == today
        }.sorted { $0.timestamp > $1.timestamp }
    }
}

// MARK: - Progress View Model
@MainActor
class ProgressViewModel: ObservableObject {
    @Published var meals: [Meal] = []
    @Published var settings: UserSettings = UserSettings()
    @Published var selectedDate: Date = Date()
    @Published var isLoading = true

    private let storageService = StorageService.shared

    func loadData() {
        isLoading = true

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let meals = try self?.storageService.getMeals() ?? []
                let settings = try self?.storageService.getSettings() ?? UserSettings()

                DispatchQueue.main.async {
                    self?.meals = meals
                    self?.settings = settings
                    self?.isLoading = false
                }
            } catch {
                DispatchQueue.main.async {
                    self?.isLoading = false
                }
            }
        }
    }

    func getSevenDayOverview() -> [(date: Date, totals: (calories: Int, protein: Int, carbs: Int, fat: Int, avgHealthScore: Int), mealsLogged: Bool)] {
        let calendar = Calendar.current
        var overview: [(date: Date, totals: (calories: Int, protein: Int, carbs: Int, fat: Int, avgHealthScore: Int), mealsLogged: Bool)] = []

        for i in (0..<7).reversed() {
            let date = calendar.date(byAdding: .day, value: -i, to: Date())!
            let totals = calculateTotals(for: meals, on: date)
            let hasMeals = totals.calories > 0

            overview.append((date, totals, hasMeals))
        }

        return overview
    }

    func getTotalsForSelectedDate() -> (calories: Int, protein: Int, carbs: Int, fat: Int, avgHealthScore: Int) {
        return calculateTotals(for: meals, on: selectedDate)
    }

    func getMealsForSelectedDate() -> [Meal] {
        let calendar = Calendar.current
        let targetDate = calendar.startOfDay(for: selectedDate)

        return meals.filter { meal in
            calendar.startOfDay(for: meal.timestamp) == targetDate
        }.sorted { $0.timestamp > $1.timestamp }
    }
}

// MARK: - Settings View Model
@MainActor
class SettingsViewModel: ObservableObject {
    @Published var settings: UserSettings = UserSettings()
    @Published var apiKey: String = ""
    @Published var isLoading = true
    @Published var showHealthKitPrompt = false
    @Published var error: String?

    private let storageService = StorageService.shared
    private let healthKitService = HealthKitService.shared

    func loadData() {
        isLoading = true

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let settings = try self?.storageService.getSettings() ?? UserSettings()

                DispatchQueue.main.async {
                    self?.settings = settings
                    self?.apiKey = settings.openai_api_key ?? ""
                    self?.isLoading = false
                }
            } catch {
                DispatchQueue.main.async {
                    self?.error = error.localizedDescription
                    self?.isLoading = false
                }
            }
        }
    }

    func saveSettings() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                var settings = self?.settings ?? UserSettings()
                settings.openai_api_key = self?.apiKey.isEmpty == false ? self?.apiKey : nil

                try self?.storageService.saveSettings(settings)

                DispatchQueue.main.async {
                    self?.settings = settings
                }
            } catch {
                DispatchQueue.main.async {
                    self?.error = error.localizedDescription
                }
            }
        }
    }

    func requestHealthKitPermissions() {
        Task {
            let granted = await healthKitService.requestPermissions()

            DispatchQueue.main.async {
                var settings = self.settings
                settings.appleHealth.permissionGranted = granted
                settings.appleHealth.enabled = granted
                self.settings = settings

                do {
                    try self.storageService.saveSettings(settings)
                } catch {
                    self.error = error.localizedDescription
                }
            }
        }
    }

    func toggleHealthKit(_ enabled: Bool) {
        if enabled && !settings.appleHealth.permissionGranted {
            showHealthKitPrompt = true
        } else {
            var settings = self.settings
            settings.appleHealth.enabled = enabled
            self.settings = settings
            saveSettings()
        }
    }
}

// MARK: - Meal View Model
@MainActor
class MealViewModel: ObservableObject {
    @Published var selectedImage: Data?
    @Published var analyzedFoodItems: [FoodItem] = []
    @Published var isAnalyzing = false
    @Published var error: String?

    private let openAIService = OpenAIService.shared
    private let storageService = StorageService.shared
    private let healthKitService = HealthKitService.shared

    func analyzeMeal(imageData: Data, apiKey: String, dailyGoals: DailyGoals) async {
        isAnalyzing = true
        error = nil

        do {
            let base64Image = imageToBase64(imageData)
            let foodItems = try await openAIService.analyzeMealPhoto(base64Image, apiKey: apiKey, dailyGoals: dailyGoals)

            DispatchQueue.main.async {
                self.selectedImage = imageData
                self.analyzedFoodItems = foodItems
                self.isAnalyzing = false
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
                self.isAnalyzing = false
            }
        }
    }

    func saveMeal(imageData: Data, foodItems: [FoodItem]) async {
        do {
            let totalCalories = foodItems.reduce(0) { $0 + $1.calories }
            let totalProtein = foodItems.reduce(0) { $0 + $1.protein }
            let totalCarbs = foodItems.reduce(0) { $0 + $1.carbs }
            let totalFat = foodItems.reduce(0) { $0 + $1.fat }
            let healthScore = foodItems.map { $0.healthScore }.reduce(0, +) / foodItems.count

            let mealId = "meal-\(Date().timeIntervalSince1970)"

            // Save image
            let imageURL = try storageService.saveImage(imageData, mealId: mealId)

            // Create meal
            let meal = Meal(
                id: mealId,
                imageUri: imageURL.absoluteString,
                items: foodItems,
                totalCalories: totalCalories,
                totalProtein: totalProtein,
                totalCarbs: totalCarbs,
                totalFat: totalFat,
                healthScore: healthScore
            )

            // Save to local storage
            try storageService.saveMeal(meal)

            // Try to sync to Apple Health if enabled
            var settings = try storageService.getSettings()
            if settings.appleHealth.enabled && settings.appleHealth.permissionGranted {
                let synced = await healthKitService.writeMealToHealth(meal)

                if !synced {
                    settings.appleHealth.syncErrors += 1
                }
                settings.appleHealth.lastSyncAttempt = Date()
                try storageService.saveSettings(settings)
            }

            // Check for achievements
            let meals = try storageService.getMeals()
            let (currentStreak, _) = calculateStreak(meals: meals)

            if let newAchievement = checkForAchievementUnlocks(currentStreak, in: settings) {
                try storageService.unlockAchievement(id: newAchievement.id)
            }

            // Update streak
            var streakData = settings.streak
            streakData.currentStreak = currentStreak
            streakData.longestStreak = max(currentStreak, settings.streak.longestStreak)
            streakData.lastLoggedDate = Date()

            try storageService.updateStreak(streakData)

            DispatchQueue.main.async {
                self.error = nil
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
            }
        }
    }
}
