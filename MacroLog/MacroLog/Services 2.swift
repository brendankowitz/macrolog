import Foundation
import HealthKit

// MARK: - HealthKit Service
class HealthKitService {
    private let healthStore = HKHealthStore()

    static let shared = HealthKitService()

    private init() {}

    // Check if HealthKit is available
    func isAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }

    // Request HealthKit permissions
    func requestPermissions() async -> Bool {
        guard isAvailable() else { return false }

        let typesToWrite: Set<HKSampleType> = [
            HKQuantityType(.dietaryEnergyConsumed),
            HKQuantityType(.dietaryProtein),
            HKQuantityType(.dietaryCarbohydrates),
            HKQuantityType(.dietaryFatTotal)
        ]

        do {
            try await healthStore.requestAuthorization(toShare: typesToWrite, read: [])
            return true
        } catch {
            print("HealthKit permission error: \(error)")
            return false
        }
    }

    // Write meal to HealthKit
    func writeMealToHealth(_ meal: Meal) async -> Bool {
        guard isAvailable() else { return false }

        do {
            let now = meal.timestamp

            // Write calories
            try await writeCalories(meal.totalCalories, timestamp: now)

            // Write protein
            try await writeProtein(meal.totalProtein, timestamp: now)

            // Write carbs
            try await writeCarbs(meal.totalCarbs, timestamp: now)

            // Write fat
            try await writeFat(meal.totalFat, timestamp: now)

            return true
        } catch {
            print("Error writing meal to HealthKit: \(error)")
            return false
        }
    }

    private func writeCalories(_ calories: Int, timestamp: Date) async throws {
        let calorieType = HKQuantityType(.dietaryEnergyConsumed)
        let quantity = HKQuantity(unit: HKUnit.kilocalorie(), doubleValue: Double(calories))
        let sample = HKQuantitySample(type: calorieType, quantity: quantity, start: timestamp, end: timestamp)

        try await healthStore.save(sample)
    }

    private func writeProtein(_ protein: Int, timestamp: Date) async throws {
        let proteinType = HKQuantityType(.dietaryProtein)
        let quantity = HKQuantity(unit: HKUnit.gram(), doubleValue: Double(protein))
        let sample = HKQuantitySample(type: proteinType, quantity: quantity, start: timestamp, end: timestamp)

        try await healthStore.save(sample)
    }

    private func writeCarbs(_ carbs: Int, timestamp: Date) async throws {
        let carbsType = HKQuantityType(.dietaryCarbohydrates)
        let quantity = HKQuantity(unit: HKUnit.gram(), doubleValue: Double(carbs))
        let sample = HKQuantitySample(type: carbsType, quantity: quantity, start: timestamp, end: timestamp)

        try await healthStore.save(sample)
    }

    private func writeFat(_ fat: Int, timestamp: Date) async throws {
        let fatType = HKQuantityType(.dietaryFatTotal)
        let quantity = HKQuantity(unit: HKUnit.gram(), doubleValue: Double(fat))
        let sample = HKQuantitySample(type: fatType, quantity: quantity, start: timestamp, end: timestamp)

        try await healthStore.save(sample)
    }
}

// MARK: - OpenAI Service
class OpenAIService {
    private let apiBaseURL = "https://api.openai.com/v1"

    static let shared = OpenAIService()

    private init() {}

    func analyzeMealPhoto(
        _ imageBase64: String,
        apiKey: String,
        dailyGoals: DailyGoals
    ) async throws -> [FoodItem] {
        let url = URL(string: "\(apiBaseURL)/chat/completions")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let prompt = """
        Analyze this meal photo and extract the following information for each food item:
        1. Name of the food
        2. Estimated amount and unit
        3. Calories (kcal)
        4. Protein (g)
        5. Carbohydrates (g)
        6. Fat (g)

        For each item, calculate a health score (0-100) based on:
        - 33% Nutrient Density (vitamins, minerals, fiber)
        - 33% Processing Level (whole foods vs processed)
        - 34% Goal Alignment (based on daily goals: \(dailyGoals.calories) cal, \(dailyGoals.protein)g protein, \(dailyGoals.carbs)g carbs, \(dailyGoals.fat)g fat)

        Provide an encouraging message for each item based on its health score.

        Return the response as JSON with this structure:
        {
          "foods": [
            {
              "name": "food name",
              "amount": 100,
              "unit": "g",
              "calories": 120,
              "protein": 20,
              "carbs": 5,
              "fat": 2,
              "healthScore": 85,
              "encouragement": "Great choice!"
            }
          ]
        }
        """

        let requestBody: [String: Any] = [
            "model": "gpt-4o",
            "messages": [
                [
                    "role": "user",
                    "content": [
                        [
                            "type": "text",
                            "text": prompt
                        ],
                        [
                            "type": "image_url",
                            "image_url": [
                                "url": "data:image/jpeg;base64,\(imageBase64)"
                            ]
                        ]
                    ]
                ]
            ],
            "max_tokens": 1024
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw MealTrackingError.analysisFailedError("Invalid response")
        }

        guard httpResponse.statusCode == 200 else {
            throw MealTrackingError.analysisFailedError("HTTP \(httpResponse.statusCode)")
        }

        let decoder = JSONDecoder()
        let openAIResponse = try decoder.decode(OpenAIResponse.self, from: data)

        let contentMessage = openAIResponse.choices.first?.message.content ?? "{}"
        let foodData = try decoder.decode(MealAnalysisResponse.self, from: contentMessage.data(using: .utf8)!)

        return foodData.foods
    }

    private struct OpenAIResponse: Decodable {
        let choices: [Choice]

        struct Choice: Decodable {
            let message: Message
        }

        struct Message: Decodable {
            let content: String
        }
    }
}

// MARK: - Storage Service
class StorageService {
    private let mealsKey = "meals"
    private let settingsKey = "userSettings"
    private let fileManager = FileManager.default
    private let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]

    static let shared = StorageService()

    private init() {}

    // MARK: Meals
    func saveMeal(_ meal: Meal) throws {
        var meals = try getMeals()
        meals.append(meal)

        let encoder = JSONEncoder()
        let data = try encoder.encode(meals)

        let defaults = UserDefaults.standard
        defaults.set(data, forKey: mealsKey)
    }

    func getMeals() throws -> [Meal] {
        let defaults = UserDefaults.standard

        guard let data = defaults.data(forKey: mealsKey) else {
            return []
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        return try decoder.decode([Meal].self, from: data)
    }

    // MARK: Settings
    func saveSettings(_ settings: UserSettings) throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(settings)

        let defaults = UserDefaults.standard
        defaults.set(data, forKey: settingsKey)
    }

    func getSettings() throws -> UserSettings {
        let defaults = UserDefaults.standard

        guard let data = defaults.data(forKey: settingsKey) else {
            return UserSettings()
        }

        let decoder = JSONDecoder()
        return try decoder.decode(UserSettings.self, from: data)
    }

    // MARK: Images
    func saveImage(_ imageData: Data, mealId: String) throws -> URL {
        let filename = "\(mealId).jpg"
        let fileURL = documentsDirectory.appendingPathComponent(filename)

        try imageData.write(to: fileURL)
        return fileURL
    }

    func loadImage(mealId: String) -> Data? {
        let filename = "\(mealId).jpg"
        let fileURL = documentsDirectory.appendingPathComponent(filename)

        return try? Data(contentsOf: fileURL)
    }

    // MARK: Streak
    func updateStreak(_ streak: StreakData) throws {
        var settings = try getSettings()
        settings.streak = streak
        try saveSettings(settings)
    }

    // MARK: Achievements
    func unlockAchievement(id: String) throws {
        var settings = try getSettings()

        if let index = settings.achievements.firstIndex(where: { $0.id == id }) {
            settings.achievements[index].unlocked = true
            settings.achievements[index].unlockedDate = Date()
        }

        try saveSettings(settings)
    }
}
